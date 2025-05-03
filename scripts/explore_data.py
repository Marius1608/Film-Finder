# scripts/explore_data_simple.py
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os
import re

os.makedirs('data/figures', exist_ok=True)
os.makedirs('data/processed', exist_ok=True)

def load_movielens_data(data_dir):
    """
    Încarcă setul de date MovieLens din directorul specificat.
    Suportă formate vechi (dat) și noi (csv).
    """
    if os.path.exists(os.path.join(data_dir, 'ratings.dat')):
        
        ratings = pd.read_csv(os.path.join(data_dir, 'ratings.dat'), 
                             sep='::', 
                             engine='python',
                             names=['userId', 'movieId', 'rating', 'timestamp'])

        movies = pd.read_csv(os.path.join(data_dir, 'movies.dat'),
                            sep='::',
                            engine='python',
                            names=['movieId', 'title', 'genres'],
                            encoding='latin-1')

        users = pd.read_csv(os.path.join(data_dir, 'users.dat'),
                           sep='::',
                           engine='python',
                           names=['userId', 'gender', 'age', 'occupation', 'zipcode'])
    
    elif os.path.exists(os.path.join(data_dir, 'ratings.csv')):
        
        ratings = pd.read_csv(os.path.join(data_dir, 'ratings.csv'))
        movies = pd.read_csv(os.path.join(data_dir, 'movies.csv'))
        
        if os.path.exists(os.path.join(data_dir, 'users.csv')):
            users = pd.read_csv(os.path.join(data_dir, 'users.csv'))
        else:
            unique_users = ratings['userId'].unique()
            users = pd.DataFrame({'userId': unique_users})
    
    elif os.path.exists(os.path.join(data_dir, 'u.data')):
        
        ratings = pd.read_csv(os.path.join(data_dir, 'u.data'), 
                             sep='\t', 
                             names=['userId', 'movieId', 'rating', 'timestamp'])
        
        movies = pd.read_csv(os.path.join(data_dir, 'u.item'),
                            sep='|',
                            encoding='latin-1',
                            header=None,
                            names=['movieId', 'title', 'release_date', 'video_release_date', 
                                  'IMDb_URL'] + [f'genre_{i}' for i in range(19)])
        
        genre_cols = [col for col in movies.columns if 'genre_' in col]
        genre_names = ['Action', 'Adventure', 'Animation', 'Children', 'Comedy', 
                       'Crime', 'Documentary', 'Drama', 'Fantasy', 'Film-Noir', 
                       'Horror', 'Musical', 'Mystery', 'Romance', 'Sci-Fi', 
                       'Thriller', 'War', 'Western', 'Unknown']
        
        movies['genres'] = movies[genre_cols].apply(
            lambda x: '|'.join([genre_names[i] for i, v in enumerate(x) if v == 1]), 
            axis=1
        )
        
        movies = movies[['movieId', 'title', 'genres']]
        
        users = pd.read_csv(os.path.join(data_dir, 'u.user'),
                           sep='|',
                           names=['userId', 'age', 'gender', 'occupation', 'zipcode'])
    else:
        raise FileNotFoundError(f"Nu s-au găsit fișierele necesare în {data_dir}")
    
    print(f"Date încărcate cu succes: {len(ratings)} rating-uri, {len(movies)} filme, {len(users)} utilizatori")
    return ratings, movies, users

def extract_year_from_title(title):
    """
    Extrage anul din titlul filmului (format: "Titlu (An)")
    """
    match = re.search(r'\((\d{4})\)', title)
    if match:
        return int(match.group(1))
    return None

print("Starting data exploration...")

ratings, movies, users = load_movielens_data('data/raw/ml-1m')

print("\nStatistici pentru ratings:")
print(ratings['rating'].describe())

plt.figure(figsize=(10, 6))
sns.histplot(ratings['rating'], bins=10, kde=True)
plt.title('Distribution of Ratings')
plt.xlabel('Rating')
plt.ylabel('Frequency')
plt.savefig('data/figures/rating_distribution.png')
plt.close()

user_ratings_count = ratings.groupby('userId').size()
plt.figure(figsize=(10, 6))
sns.histplot(user_ratings_count, bins=50, kde=True)
plt.title('Number of Ratings per User')
plt.xlabel('Number of Ratings')
plt.ylabel('Number of Users')
plt.savefig('data/figures/ratings_per_user.png')
plt.close()

movie_stats = ratings.groupby('movieId').agg({'rating': ['mean', 'count']})
movie_stats.columns = ['avg_rating', 'num_ratings']
movie_stats = movie_stats.reset_index()

movie_stats = movie_stats.merge(movies[['movieId', 'title']], on='movieId')

min_ratings = 100
popular_movies = movie_stats[movie_stats['num_ratings'] >= min_ratings].sort_values('avg_rating', ascending=False)
print("\nTop 10 highest rated movies (with at least 100 ratings):")
print(popular_movies[['title', 'avg_rating', 'num_ratings']].head(10))

movies['year'] = movies['title'].apply(extract_year_from_title)

plt.figure(figsize=(12, 6))
movies['year'].value_counts().sort_index().plot(kind='bar')
plt.title('Number of Movies by Year')
plt.xlabel('Year')
plt.ylabel('Number of Movies')
plt.xticks(rotation=90)
plt.tight_layout()
plt.savefig('data/figures/movies_by_year.png')
plt.close()

genres = []
for genre_list in movies['genres'].str.split('|'):
    if isinstance(genre_list, list):
        genres.extend(genre_list)

genre_counts = pd.Series(genres).value_counts()
plt.figure(figsize=(10, 6))
genre_counts.plot(kind='bar')
plt.title('Movie Count by Genre')
plt.xlabel('Genre')
plt.ylabel('Number of Movies')
plt.tight_layout()
plt.savefig('data/figures/genres_distribution.png')
plt.close()

movie_stats.to_csv('data/processed/movie_stats.csv', index=False)
popular_movies.head(100).to_csv('data/processed/top_rated_movies.csv', index=False)

with open('data/processed/data_exploration_summary.md', 'w') as f:
    f.write("# MovieLens Data Exploration Summary\n\n")
    f.write(f"## Dataset Overview\n")
    f.write(f"- Total users: {len(users)}\n")
    f.write(f"- Total movies: {len(movies)}\n")
    f.write(f"- Total ratings: {len(ratings)}\n")
    f.write(f"- Rating scale: {ratings['rating'].min()} to {ratings['rating'].max()}\n\n")
    
    f.write("## Key Insights\n")
    f.write(f"- Average rating across all movies: {ratings['rating'].mean():.2f}\n")
    f.write(f"- Most common rating: {ratings['rating'].value_counts().idxmax()}\n")
    f.write(f"- Most rated movie: {movie_stats.sort_values('num_ratings', ascending=False)['title'].iloc[0]}\n")
    f.write(f"- Highest rated movie (min. 100 ratings): {popular_movies['title'].iloc[0]} (avg: {popular_movies['avg_rating'].iloc[0]:.2f})\n")
    f.write(f"- Most common genre: {genre_counts.index[0]} ({genre_counts.values[0]} movies)\n\n")
    
    f.write(f"- Year range of movies: {movies['year'].min()} to {movies['year'].max()}\n")
    f.write(f"- Decade with most movies: {(movies['year'] // 10 * 10).value_counts().idxmax()}s\n\n")
    
    f.write("## Next Steps\n")
    f.write("- Clean and preprocess data for model development\n")
    f.write("- Create feature vectors for content-based filtering\n")
    f.write("- Split data into training and test sets\n")
    f.write("- Implement recommendation algorithms\n")

print("\nData exploration completed. Results saved in data/processed/ and data/figures/")