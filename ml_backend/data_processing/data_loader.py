import pandas as pd
import os
from datetime import datetime
from database.models import Movie, Rating, User, MovieLink, UserApplication
from database.connection import SessionLocal


class DataLoader:
    def __init__(self, data_path="ml-latest-small"):
        self.data_path = data_path
        self.session = SessionLocal()

    def load_movielens_data(self):
        try:
            movies_path = os.path.join(self.data_path, "movies.csv")
            ratings_path = os.path.join(self.data_path, "ratings.csv")
            links_path = os.path.join(self.data_path, "links.csv")

            print(f"Încarcă date din {movies_path}")
            movies_df = pd.read_csv(movies_path)
            print(f"Încarcate {len(movies_df)} filme")

            print(f"Încarcă date din {ratings_path}")
            ratings_df = pd.read_csv(ratings_path)
            print(f"Încarcate {len(ratings_df)} rating-uri")

            print(f"Încarcă date din {links_path}")
            links_df = pd.read_csv(links_path)
            print(f"Încarcate {len(links_df)} link-uri")

            return movies_df, ratings_df, links_df

        except Exception as e:
            print(f"Eroare la încărcarea datelor: {str(e)}")
            return None, None, None

    def process_movies(self, movies_df):
        processed_movies = []

        for _, row in movies_df.iterrows():
            year = None
            title = row['title']
            if '(' in title and ')' in title:
                try:
                    year_str = title[title.rfind('(') + 1:title.rfind(')')]
                    if year_str.isdigit():
                        year = int(year_str)
                        title = title[:title.rfind('(')].strip()
                except:
                    pass

            movie = {
                'id': int(row['movieId']),
                'title': title,
                'year': year,
                'genres': row['genres']
            }
            processed_movies.append(movie)

        return processed_movies

    def save_movies_to_db(self, movies_list):
        try:
            batch_size = 100 
            total_saved = 0

            for i in range(0, len(movies_list), batch_size):
                batch = movies_list[i:i + batch_size]

                for movie_dict in batch:
                    existing_movie = self.session.query(Movie).filter(
                        Movie.id == movie_dict['id']
                    ).first()

                    if not existing_movie:
                        movie = Movie(**movie_dict)
                        self.session.add(movie)
                        total_saved += 1

                # Commit după fiecare batch
                self.session.commit()
                print(f"Salvate {min(i + batch_size, len(movies_list))} din {len(movies_list)} filme")

            print(f"Total filme salvate: {total_saved}")

        except Exception as e:
            self.session.rollback()
            print(f"Eroare la salvarea filmelor: {str(e)}")
            import traceback
            traceback.print_exc()

    def save_links_to_db(self, links_df):
        try:
            batch_size = 100
            total_saved = 0

            for i in range(0, len(links_df), batch_size):
                batch = links_df.iloc[i:i + batch_size]

                for _, row in batch.iterrows():
                    movie_id = int(row['movieId'])
                    movie = self.session.query(Movie).filter(Movie.id == movie_id).first()

                    if movie:

                        if pd.notna(row['imdbId']):
                            movie.imdb_id = str(row['imdbId'])
                        if pd.notna(row['tmdbId']):
                            movie.tmdb_id = int(row['tmdbId'])

                        existing_link = self.session.query(MovieLink).filter(
                            MovieLink.movie_id == movie_id
                        ).first()

                        if not existing_link:
                            link = MovieLink(
                                movie_id=movie_id,
                                imdb_id=str(row['imdbId']) if pd.notna(row['imdbId']) else None,
                                tmdb_id=int(row['tmdbId']) if pd.notna(row['tmdbId']) else None
                            )
                            self.session.add(link)
                            total_saved += 1

                self.session.commit()
                print(f"Procesate {min(i + batch_size, len(links_df))} din {len(links_df)} link-uri")

            print(f"Total link-uri salvate: {total_saved}")

        except Exception as e:
            self.session.rollback()
            print(f"Eroare la salvarea link-urilor: {str(e)}")
            import traceback
            traceback.print_exc()

    def save_ratings_to_db(self, ratings_df):
        try:
            batch_size = 1000
            ratings_created = 0
            users_created = 0

            unique_users = ratings_df['userId'].unique()

            print("Creez utilizatorii...")
            for i in range(0, len(unique_users), batch_size):
                user_batch = unique_users[i:i + batch_size]

                for user_id in user_batch:
                    user = self.session.query(User).filter(User.id == user_id).first()
                    if not user:
                        user = User(
                            id=int(user_id),
                            email=f"user_{user_id}@movielens.org",
                            password_hash="dummy_hash"
                        )
                        self.session.add(user)
                        users_created += 1

                self.session.commit()
                print(f"Creați {min(i + batch_size, len(unique_users))} din {len(unique_users)} utilizatori")

            print("Salvez rating-urile...")
            for i in range(0, len(ratings_df), batch_size):
                batch = ratings_df.iloc[i:i + batch_size]

                for _, row in batch.iterrows():
                    user_id = int(row['userId'])
                    movie_id = int(row['movieId'])
                    rating_value = float(row['rating'])
                    timestamp = datetime.fromtimestamp(int(row['timestamp']))

                    movie = self.session.query(Movie).filter(Movie.id == movie_id).first()
                    if movie:
                        existing_rating = self.session.query(Rating).filter(
                            Rating.user_id == user_id,
                            Rating.movie_id == movie_id
                        ).first()

                        if not existing_rating:
                            rating = Rating(
                                user_id=user_id,
                                movie_id=movie_id,
                                rating=rating_value,
                                timestamp=timestamp
                            )
                            self.session.add(rating)
                            ratings_created += 1

                self.session.commit()
                print(f"Procesate {min(i + batch_size, len(ratings_df))} din {len(ratings_df)} rating-uri")

            print(f"Salvate {ratings_created} rating-uri și {users_created} utilizatori")

        except Exception as e:
            self.session.rollback()
            print(f"Eroare la salvarea rating-urilor: {str(e)}")
            import traceback
            traceback.print_exc()


    def load_and_save_all(self):
        movies_df, ratings_df, links_df = self.load_movielens_data()
        if movies_df is not None and ratings_df is not None and links_df is not None:

            self.session.connection(execution_options={"charset": "utf8mb4"})

            processed_movies = self.process_movies(movies_df)
            self.save_movies_to_db(processed_movies)
            self.save_links_to_db(links_df)
            self.save_ratings_to_db(ratings_df)

            return True
        return False

    def close(self):
        self.session.close()