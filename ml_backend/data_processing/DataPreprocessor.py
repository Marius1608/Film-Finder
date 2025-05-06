import pandas as pd
import numpy as np
from sqlalchemy import text
from database.connection import SessionLocal
from database.models import Movie, Rating, User, Base
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import logging
from datetime import datetime
import json

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class DataPreprocessor:
    def __init__(self):
        self.session = SessionLocal()
        self.engine = self.session.bind

    def create_processed_tables(self):
        try:
            with self.engine.begin() as conn:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS movie_stats (
                        movie_id INTEGER PRIMARY KEY,
                        avg_rating FLOAT,
                        rating_count INTEGER,
                        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (movie_id) REFERENCES movies(id)
                    )
                """))

                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS movie_similarity (
                        id INTEGER PRIMARY KEY AUTO_INCREMENT,
                        movie_id1 INTEGER,
                        movie_id2 INTEGER,
                        similarity_score FLOAT,
                        method VARCHAR(50),
                        FOREIGN KEY (movie_id1) REFERENCES movies(id),
                        FOREIGN KEY (movie_id2) REFERENCES movies(id),
                        UNIQUE KEY (movie_id1, movie_id2, method)
                    )
                """))

                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS user_profiles (
                        user_id INTEGER PRIMARY KEY,
                        favorite_genres JSON,
                        avg_rating FLOAT,
                        rating_count INTEGER,
                        rating_variance FLOAT,
                        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id)
                    )
                """))

                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS movie_genre_vectors (
                        movie_id INTEGER PRIMARY KEY,
                        genre_vector JSON,
                        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (movie_id) REFERENCES movies(id)
                    )
                """))

            logger.info("Tabelele procesate au fost create cu succes!")
            return True

        except Exception as e:
            logger.error(f"Eroare la crearea tabelelor: {e}")
            return False

    def calculate_movie_stats(self):

        try:
            query = text("""
                SELECT 
                    m.id as movie_id,
                    AVG(r.rating) as avg_rating,
                    COUNT(r.id) as rating_count
                FROM movies m
                LEFT JOIN ratings r ON m.id = r.movie_id
                GROUP BY m.id
            """)

            df = pd.read_sql(query, self.engine)

            with self.engine.begin() as conn:

                conn.execute(text("DELETE FROM movie_stats"))

                for _, row in df.iterrows():
                    conn.execute(text("""
                        INSERT INTO movie_stats (movie_id, avg_rating, rating_count)
                        VALUES (:movie_id, :avg_rating, :rating_count)
                    """), {
                        'movie_id': row['movie_id'],
                        'avg_rating': row['avg_rating'] if pd.notna(row['avg_rating']) else 0.0,
                        'rating_count': row['rating_count']
                    })

            logger.info(f"Statistici calculate pentru {len(df)} filme")
            return True

        except Exception as e:
            logger.error(f"Eroare la calcularea statisticilor: {e}")
            return False

    def create_item_collaborative_similarity(self):
        try:
            query = text("""
                SELECT r.user_id, r.movie_id, r.rating
                FROM ratings r
                INNER JOIN movies m ON r.movie_id = m.id
            """)

            df = pd.read_sql(query, self.engine)

            user_item_matrix = df.pivot_table(
                index='user_id',
                columns='movie_id',
                values='rating'
            ).fillna(0)

            item_similarity = cosine_similarity(user_item_matrix.T)

            similarity_df = pd.DataFrame(
                item_similarity,
                index=user_item_matrix.columns,
                columns=user_item_matrix.columns
            )

            top_k = 20

            with self.engine.begin() as conn:

                conn.execute(text("DELETE FROM movie_similarity WHERE method = 'item_collaborative'"))

                for movie_id in similarity_df.index:

                    similar_movies = similarity_df[movie_id].sort_values(ascending=False)[1:top_k + 1]

                    for similar_id, score in similar_movies.items():
                        if score > 0.1:
                            conn.execute(text("""
                                INSERT INTO movie_similarity 
                                (movie_id1, movie_id2, similarity_score, method)
                                VALUES (:movie_id1, :movie_id2, :score, 'item_collaborative')
                            """), {
                                'movie_id1': int(movie_id),
                                'movie_id2': int(similar_id),
                                'score': float(score)
                            })

            logger.info("Similarități item-based calculate cu succes!")
            return True

        except Exception as e:
            logger.error(f"Eroare la calcularea similarităților: {e}")
            return False

    def process_genre_similarities(self):
        try:

            query = text("SELECT id, genres FROM movies WHERE genres IS NOT NULL")
            df = pd.read_sql(query, self.engine)

            all_genres = set()
            for genres in df['genres']:
                for genre in genres.split('|'):
                    all_genres.add(genre)

            genre_list = list(all_genres)
            genre_to_idx = {genre: idx for idx, genre in enumerate(genre_list)}

            movie_vectors = []
            movie_ids = []

            for _, row in df.iterrows():
                vector = np.zeros(len(genre_list))
                for genre in row['genres'].split('|'):
                    if genre in genre_to_idx:
                        vector[genre_to_idx[genre]] = 1
                movie_vectors.append(vector)
                movie_ids.append(row['id'])

            movie_vectors = np.array(movie_vectors)
            genre_similarity = cosine_similarity(movie_vectors)

            with self.engine.begin() as conn:

                conn.execute(text("DELETE FROM movie_genre_vectors"))
                conn.execute(text("DELETE FROM movie_similarity WHERE method = 'genre'"))

                for idx, movie_id in enumerate(movie_ids):
                    vector_json = movie_vectors[idx].tolist()
                    conn.execute(text("""
                        INSERT INTO movie_genre_vectors (movie_id, genre_vector)
                        VALUES (:movie_id, :vector)
                    """), {
                        'movie_id': int(movie_id),
                        'vector': json.dumps(vector_json)  # Formatăm ca JSON valid
                    })

                for i in range(len(movie_ids)):
                    for j in range(i + 1, len(movie_ids)):
                        score = genre_similarity[i][j]
                        if score > 0.1:
                            conn.execute(text("""
                                INSERT INTO movie_similarity 
                                (movie_id1, movie_id2, similarity_score, method)
                                VALUES (:movie_id1, :movie_id2, :score, 'genre')
                            """), {
                                'movie_id1': int(movie_ids[i]),
                                'movie_id2': int(movie_ids[j]),
                                'score': float(score)
                            })

            logger.info("Genre similarity calculată cu succes!")
            return True

        except Exception as e:
            logger.error(f"Eroare la procesarea genurilor: {e}")
            return False

    def create_user_profiles(self):
        try:
            query = text("""
                SELECT 
                    u.id as user_id,
                    COUNT(r.id) as rating_count,
                    AVG(r.rating) as avg_rating,
                    VARIANCE(r.rating) as rating_variance,
                    m.genres
                FROM users u
                JOIN ratings r ON u.id = r.user_id
                JOIN movies m ON r.movie_id = m.id
                WHERE m.genres IS NOT NULL
                GROUP BY u.id, m.genres
            """)

            df = pd.read_sql(query, self.engine)

            user_profiles = {}
            for _, row in df.iterrows():
                user_id = row['user_id']
                if user_id not in user_profiles:
                    user_profiles[user_id] = {
                        'favorite_genres': {},
                        'avg_rating': 0,
                        'rating_count': 0,
                        'rating_variance': 0
                    }

                user_profiles[user_id]['rating_count'] = row['rating_count']
                user_profiles[user_id]['avg_rating'] = row['avg_rating']
                user_profiles[user_id]['rating_variance'] = row['rating_variance']

                if row['genres']:
                    for genre in row['genres'].split('|'):
                        if genre not in user_profiles[user_id]['favorite_genres']:
                            user_profiles[user_id]['favorite_genres'][genre] = 0
                        user_profiles[user_id]['favorite_genres'][genre] += 1

            with self.engine.begin() as conn:

                conn.execute(text("DELETE FROM user_profiles"))

                for user_id, profile in user_profiles.items():
                    sorted_genres = dict(sorted(
                        profile['favorite_genres'].items(),
                        key=lambda x: x[1],
                        reverse=True
                    ))

                    conn.execute(text("""
                        INSERT INTO user_profiles 
                        (user_id, favorite_genres, avg_rating, rating_count, rating_variance)
                        VALUES (:user_id, :favorite_genres, :avg_rating, :rating_count, :rating_variance)
                    """), {
                        'user_id': int(user_id),
                        'favorite_genres': json.dumps(sorted_genres),  # Convertim în JSON valid
                        'avg_rating': float(profile['avg_rating']),
                        'rating_count': int(profile['rating_count']),
                        'rating_variance': float(profile['rating_variance']) if profile['rating_variance'] else 0.0
                    })

            logger.info(f"Profile create pentru {len(user_profiles)} utilizatori")
            return True

        except Exception as e:
            logger.error(f"Eroare la crearea profilurilor: {e}")
            return False

    def run_all_preprocessing(self):

        logger.info("Începe prelucrarea datelor...")

        #if not self.create_processed_tables():
            #logger.error("Eșec la crearea tabelelor")
            #return False

        #if not self.calculate_movie_stats():
           #logger.error("Eșec la calcularea statisticilor")
            #return False

        #if not self.create_item_collaborative_similarity():
            #logger.error("Eșec la calcularea similarităților item-based")
            #return False

        if not self.process_genre_similarities():
            logger.error("Eșec la procesarea similarităților de gen")
            return False

        if not self.create_user_profiles():
            logger.error("Eșec la crearea profilurilor utilizatori")
            return False

        logger.info("Prelucrarea datelor completată cu succes!")
        return True

    def close(self):
        self.session.close()


if __name__ == "__main__":
    preprocessor = DataPreprocessor()
    try:
        preprocessor.run_all_preprocessing()
    finally:
        preprocessor.close()