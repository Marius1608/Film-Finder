# src/utils/data_utils.py
import pandas as pd
import re
import os

def load_movielens_data(data_dir):
    """
    Încarcă setul de date MovieLens din directorul specificat.
    Suportă formate 100K sau 1M.
    """
    # Verifică formatul setului de date (100K sau 1M)
    if os.path.exists(os.path.join(data_dir, 'ratings.dat')):
        # Format 1M
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
        
    elif os.path.exists(os.path.join(data_dir, 'u.data')):
        # Format 100K
        ratings = pd.read_csv(os.path.join(data_dir, 'u.data'), 
                             sep='\t', 
                             names=['userId', 'movieId', 'rating', 'timestamp'])
        
        # Citire metadata pentru filme (cu encoding corect)
        movies = pd.read_csv(os.path.join(data_dir, 'u.item'),
                            sep='|',
                            encoding='latin-1',
                            header=None,
                            names=['movieId', 'title', 'release_date', 'video_release_date', 
                                  'IMDb_URL'] + [f'genre_{i}' for i in range(19)])
        
        # Combinăm coloanele de gen într-o singură coloană
        genre_cols = [col for col in movies.columns if 'genre_' in col]
        genre_names = ['Action', 'Adventure', 'Animation', 'Children', 'Comedy', 
                       'Crime', 'Documentary', 'Drama', 'Fantasy', 'Film-Noir', 
                       'Horror', 'Musical', 'Mystery', 'Romance', 'Sci-Fi', 
                       'Thriller', 'War', 'Western', 'Unknown']
        
        # Creează o coloană pentru genuri
        movies['genres'] = movies[genre_cols].apply(
            lambda x: '|'.join([genre_names[i] for i, v in enumerate(x) if v == 1]), 
            axis=1
        )
        
        # Simplificăm dataframe-ul pentru a păstra doar coloanele relevante
        movies = movies[['movieId', 'title', 'genres']]
        
        # Încarcă datele utilizatorilor
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

def preprocess_movies(movies):
    """
    Preprocesează dataframe-ul de filme:
    - Extrage anul din titlu
    - Curăță titlul (eliminând anul)
    """
    # Extrage anul din titlu
    movies['year'] = movies['title'].apply(extract_year_from_title)
    
    # Curăță titlul (opțional)
    movies['clean_title'] = movies['title'].apply(lambda x: re.sub(r'\s*\(\d{4}\)\s*$', '', x))
    
    return movies