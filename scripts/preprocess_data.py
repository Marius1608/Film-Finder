#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import pandas as pd
import numpy as np
from scipy import sparse
from sklearn.metrics.pairwise import cosine_similarity
import pickle
from pathlib import Path
import matplotlib.pyplot as plt
import seaborn as sns

ROOT_DIR = Path(__file__).resolve().parents[1]
RAW_DATA_DIR = ROOT_DIR / "data" / "raw" / "ml-1m"
PROCESSED_DATA_DIR = ROOT_DIR / "data" / "processed"
PREPROCESSED_DATA_DIR = ROOT_DIR / "data" / "preprocessed"

PREPROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

def load_data():
    """Încărcăm datele din fișierele CSV."""
    print("Încărcare date MovieLens...")
    
    movies_path = RAW_DATA_DIR / "movies.csv"
    ratings_path = RAW_DATA_DIR / "ratings.csv"
    
    movies_df = pd.read_csv(movies_path)
    ratings_df = pd.read_csv(ratings_path)
    
    print(f"Încărcate {len(movies_df)} filme și {len(ratings_df)} rating-uri.")
    return movies_df, ratings_df

def preprocess_movie_data(movies_df):
    """Prelucrează datele despre filme pentru a extrage caracteristici."""
    print("Preprocesare date filme...")
    
    movies_df['year'] = movies_df['title'].str.extract(r'\((\d{4})\)').astype('float')
    
    genres_list = []
    for genres in movies_df['genres'].str.split('|'):
        genres_list.extend(genres)
    unique_genres = sorted(list(set(genres_list) - {'(no genres listed)'}))
    
    genre_features = pd.DataFrame(0, index=movies_df.index, columns=unique_genres)
    
    for i, genres in enumerate(movies_df['genres'].str.split('|')):
        for genre in genres:
            if genre in unique_genres:
                genre_features.loc[i, genre] = 1
    
    movies_df = pd.concat([movies_df, genre_features], axis=1)
    
    movies_features_path = PREPROCESSED_DATA_DIR / "movies_features.csv"
    movies_df.to_csv(movies_features_path, index=False)
    print(f"Date filme preprocesate salvate în {movies_features_path}")
    
    genres_path = PREPROCESSED_DATA_DIR / "genres.csv"
    pd.DataFrame(unique_genres, columns=["genre"]).to_csv(genres_path, index=False)
    
    return movies_df, unique_genres

def create_content_based_features(movies_df, unique_genres):
    """Crearea vectorilor de caracteristici pentru filme bazate pe conținut."""
    print("Creare vectori de caracteristici pentru filme...")
    
    content_features = movies_df[unique_genres].values
    
    row_sums = content_features.sum(axis=1)
    
    content_features_normalized = np.zeros_like(content_features, dtype=float)
    
    nonzero_rows = row_sums > 0
    if np.any(nonzero_rows):
        content_features_normalized[nonzero_rows] = (
            content_features[nonzero_rows] / row_sums[nonzero_rows, np.newaxis]
        )
    
    if np.isnan(content_features_normalized).any() or np.isinf(content_features_normalized).any():
        print("AVERTISMENT: S-au detectat valori NaN sau infinite. Înlocuim cu zero.")
        content_features_normalized = np.nan_to_num(content_features_normalized)
    
    print("Calculare matrice de similaritate (poate dura câteva minute)...")
    similarity_matrix = cosine_similarity(content_features_normalized)
    
    similarity_path = PREPROCESSED_DATA_DIR / "similarity_matrix.pkl"
    with open(similarity_path, 'wb') as f:
        pickle.dump(similarity_matrix, f)
    print(f"Matricea de similaritate salvată în {similarity_path}")
    
    features_path = PREPROCESSED_DATA_DIR / "normalized_features.npy"
    np.save(features_path, content_features_normalized)
    print(f"Vectorii de caracteristici normalizate salvați în {features_path}")
    
    movie_similarity_examples = {}
    for i in range(min(20, len(movies_df))):
        movie_id = movies_df.iloc[i]['movieId']
        movie_title = movies_df.iloc[i]['title']
        
        similar_indices = similarity_matrix[i].argsort()[-6:-1][::-1]
        similar_movies = [(movies_df.iloc[idx]['title'], similarity_matrix[i][idx]) 
                          for idx in similar_indices]
        
        movie_similarity_examples[movie_title] = similar_movies
    
    with open(PREPROCESSED_DATA_DIR / "similarity_examples.txt", 'w', encoding='utf-8') as f:
        for movie, similars in movie_similarity_examples.items():
            f.write(f"Filme similare cu '{movie}':\n")
            for similar_movie, score in similars:
                f.write(f"  - {similar_movie} (scor: {score:.2f})\n")
            f.write("\n")
    
    print(f"Exemple de similaritate salvate în {PREPROCESSED_DATA_DIR / 'similarity_examples.txt'}")
    
    return similarity_matrix

def preprocess_user_data(ratings_df, movies_df, unique_genres):
    """Preprocesarea datelor de utilizator pentru a crea profile de utilizator."""
    print("Preprocesare date utilizator...")
    
    user_ids = ratings_df['userId'].unique()
    movie_ids = movies_df['movieId'].unique()
    
    user_id_map = {id: i for i, id in enumerate(user_ids)}
    movie_id_map = {id: i for i, id in enumerate(movie_ids)}
    
    user_indices = [user_id_map[id] for id in ratings_df['userId']]
    movie_indices = [movie_id_map[id] for id in ratings_df['movieId']]
    ratings = ratings_df['rating'].values
    
    user_item_matrix = sparse.csr_matrix((ratings, (user_indices, movie_indices)),
                                          shape=(len(user_ids), len(movie_ids)))
    
    user_item_path = PREPROCESSED_DATA_DIR / "user_item_matrix.npz"
    sparse.save_npz(user_item_path, user_item_matrix)
    print(f"Matricea user-item salvată în {user_item_path}")
    
    user_mapping_path = PREPROCESSED_DATA_DIR / "user_id_mapping.pkl"
    movie_mapping_path = PREPROCESSED_DATA_DIR / "movie_id_mapping.pkl"
    
    with open(user_mapping_path, 'wb') as f:
        pickle.dump(user_id_map, f)
    
    with open(movie_mapping_path, 'wb') as f:
        pickle.dump(movie_id_map, f)
    
    create_predefined_user_profiles(movies_df, unique_genres)
    
    return user_item_matrix

def create_predefined_user_profiles(movies_df, unique_genres):
    """Creează profile de utilizator predefinite pentru utilizare imediată."""
    print("Creare profile de utilizator predefinite...")
    
    profiles = {
        "action_fan": ["Action", "Adventure", "Sci-Fi"],
        "drama_lover": ["Drama", "Romance"],
        "comedy_enthusiast": ["Comedy", "Animation"],
        "thriller_addict": ["Thriller", "Horror", "Mystery"],
        "documentary_watcher": ["Documentary"]
    }
    
    profile_vectors = {}
    for profile_name, genres in profiles.items():
       
        profile_vector = np.zeros(len(unique_genres))
        
        for genre in genres:
            if genre in unique_genres:
                genre_index = unique_genres.index(genre)
                profile_vector[genre_index] = 1
        
        if np.sum(profile_vector) > 0:
            profile_vector = profile_vector / np.sum(profile_vector)
        
        profile_vectors[profile_name] = profile_vector
    
    profile_path = PREPROCESSED_DATA_DIR / "predefined_profiles.pkl"
    with open(profile_path, 'wb') as f:
        pickle.dump(profile_vectors, f)
    
    generate_profile_recommendations(profile_vectors, movies_df, unique_genres)
    
    print(f"Profile predefinite salvate în {profile_path}")

def generate_profile_recommendations(profiles, movies_df, unique_genres):
    """Generează recomandări pentru fiecare profil predefinit."""
    print("Generare recomandări pentru profile predefinite...")
    
    movie_features = movies_df[unique_genres].values
    
    row_sums = movie_features.sum(axis=1)
    normalized_features = np.zeros_like(movie_features, dtype=float)
    
    nonzero_rows = row_sums > 0
    if np.any(nonzero_rows):
        normalized_features[nonzero_rows] = (
            movie_features[nonzero_rows] / row_sums[nonzero_rows, np.newaxis]
        )
    
    normalized_features = np.nan_to_num(normalized_features)
    
    profile_recommendations = {}
    
    for profile_name, profile_vector in profiles.items():
       
        scores = normalized_features.dot(profile_vector)
        
        top_indices = np.argsort(scores)[-20:][::-1]
        top_movies = [(movies_df.iloc[i]['movieId'], movies_df.iloc[i]['title'], scores[i]) 
                      for i in top_indices]
        
        profile_recommendations[profile_name] = top_movies
    
    profile_recs_path = PREPROCESSED_DATA_DIR / "profile_recommendations.pkl"
    with open(profile_recs_path, 'wb') as f:
        pickle.dump(profile_recommendations, f)
    
    with open(PREPROCESSED_DATA_DIR / "profile_recommendations.txt", 'w', encoding='utf-8') as f:
        for profile, recommendations in profile_recommendations.items():
            f.write(f"Top recomandări pentru profilul '{profile}':\n")
            for i, (movie_id, title, score) in enumerate(recommendations, 1):
                f.write(f"{i}. {title} (scor: {score:.2f})\n")
            f.write("\n")
    
    print(f"Recomandări pentru profile salvate în {profile_recs_path}")

def create_visualizations():
    """Creează vizualizări pentru datele preprocesate."""
    print("Creare vizualizări pentru datele preprocesate...")
    
    viz_dir = PREPROCESSED_DATA_DIR / "visualizations"
    viz_dir.mkdir(exist_ok=True)
    
    movies_df = pd.read_csv(PREPROCESSED_DATA_DIR / "movies_features.csv")
    
    plt.figure(figsize=(12, 6))
    genre_counts = movies_df.iloc[:, 4:].sum().sort_values(ascending=False)
    sns.barplot(x=genre_counts.index, y=genre_counts.values)
    plt.title('Distribuția genurilor în colecția de filme')
    plt.ylabel('Număr de filme')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(viz_dir / "genre_distribution.png")
    plt.close()
    
    plt.figure(figsize=(12, 6))
    year_data = movies_df['year'].dropna()
    if not year_data.empty:
        year_distribution = year_data.value_counts().sort_index()
        sns.lineplot(x=year_distribution.index, y=year_distribution.values)
        plt.title('Distribuția filmelor pe ani')
        plt.xlabel('An')
        plt.ylabel('Număr de filme')
        plt.tight_layout()
        plt.savefig(viz_dir / "year_distribution.png")
    else:
        print("Nu există date de ani valide pentru vizualizare")
    plt.close()
    
    print(f"Vizualizări salvate în {viz_dir}")

def main():
    """Funcția principală care rulează întregul proces de preprocesare."""
    print("Începere preprocesare date pentru sistemul de recomandare FilmFinder...")
    
    movies_df, ratings_df = load_data()
    
    movies_df, unique_genres = preprocess_movie_data(movies_df)
    
    similarity_matrix = create_content_based_features(movies_df, unique_genres)
    
    user_item_matrix = preprocess_user_data(ratings_df, movies_df, unique_genres)
    
    create_visualizations()
    
    print("Preprocesare finalizată cu succes!")

if __name__ == "__main__":
    main()