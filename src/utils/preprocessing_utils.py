#!/usr/bin/env python
# -*- coding: utf-8 -*-

import numpy as np
import pandas as pd
from scipy import sparse
from sklearn.preprocessing import MinMaxScaler
import re

def extract_year_from_title(title):
    """Extrage anul din titlul filmului (format: "Titlu Film (An)")."""
    year_match = re.search(r'\((\d{4})\)', title)
    if year_match:
        return int(year_match.group(1))
    return None

def create_genre_features(movies_df):
    """Transformă genurile din format string în matrice one-hot."""
    
    genres_list = []
    for genres in movies_df['genres'].str.split('|'):
        genres_list.extend(genres)
    unique_genres = sorted(list(set(genres_list) - {'(no genres listed)'}))
    
    genre_features = pd.DataFrame(0, index=movies_df.index, columns=unique_genres)
    
    for i, genres in enumerate(movies_df['genres'].str.split('|')):
        for genre in genres:
            if genre in unique_genres:
                genre_features.iloc[i][genre] = 1
    
    return genre_features, unique_genres

def normalize_features(features):
    """Normalizează valorile unei matrice de caracteristici."""
   
    row_sums = features.sum(axis=1)
    nonzero_rows = row_sums > 0
    normalized = features.copy()
    normalized[nonzero_rows] = normalized[nonzero_rows] / row_sums[nonzero_rows, np.newaxis]
    return normalized

def create_user_item_matrix(ratings_df, movies_df):
    """Creează o matrice user-item din date de rating."""
    user_ids = ratings_df['userId'].unique()
    movie_ids = movies_df['movieId'].unique()
    
    user_id_map = {id: i for i, id in enumerate(user_ids)}
    movie_id_map = {id: i for i, id in enumerate(movie_ids)}
    
    user_indices = [user_id_map[id] for id in ratings_df['userId']]
    movie_indices = [movie_id_map[id] for id in ratings_df['movieId']]
    ratings = ratings_df['rating'].values
    
    user_item_matrix = sparse.csr_matrix((ratings, (user_indices, movie_indices)),
                                         shape=(len(user_ids), len(movie_ids)))
    
    return user_item_matrix, user_id_map, movie_id_map

def compute_user_profile(user_ratings, movie_features):
    """Calculează profilul unui utilizator bazat pe rating-urile acordate filmelor."""
    
    rated_items = user_ratings > 0
    if rated_items.sum() == 0:
        return np.zeros(movie_features.shape[1])
    
    user_profile = (user_ratings[rated_items].reshape(-1, 1) * 
                    movie_features[rated_items]).sum(axis=0)
    
    profile_norm = np.linalg.norm(user_profile)
    if profile_norm > 0:
        user_profile = user_profile / profile_norm
    
    return user_profile

def create_predefined_profiles(unique_genres):
    """Creează profile de utilizator predefinite."""
    profiles = {
        "action_fan": ["Action", "Adventure", "Sci-Fi"],
        "drama_lover": ["Drama", "Romance"],
        "comedy_enthusiast": ["Comedy", "Animation"],
        "thriller_addict": ["Thriller", "Horror", "Mystery"],
        "documentary_watcher": ["Documentary"],
        "family_viewer": ["Family", "Children", "Animation"],
        "classic_cinephile": ["Film-Noir", "Classic", "Western"],
        "international_fan": ["Foreign", "Independent"],
        "musical_appreciator": ["Musical"]
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
    
    return profile_vectors

def get_top_recommendations(item_scores, movies_df, n=10, exclude_items=None):
    """Obține top N recomandări bazate pe scorurile calculate pentru filme."""
    if exclude_items is None:
        exclude_items = []
    
    item_indices = np.argsort(item_scores)[::-1]
    top_indices = [idx for idx in item_indices 
                  if idx not in exclude_items][:n]
    
    recommendations = []
    for idx in top_indices:
        movie_id = movies_df.iloc[idx]['movieId']
        title = movies_df.iloc[idx]['title']
        score = item_scores[idx]
        recommendations.append({
            'movie_id': movie_id,
            'title': title,
            'score': score
        })
    
    return recommendations

def calculate_genre_preferences(user_ratings, movies_df, unique_genres):
    """Calculează preferințele de gen ale unui utilizator bazate pe istoric."""
    rated_items = user_ratings > 0
    if rated_items.sum() == 0:
        return {}
    
    rated_movies = movies_df.iloc[rated_items]
    genre_matrix = rated_movies[unique_genres].values
    
    weights = user_ratings[rated_items].reshape(-1, 1)
    weighted_genres = genre_matrix * weights
    
    genre_scores = weighted_genres.sum(axis=0)
    
    total = genre_scores.sum()
    if total > 0:
        genre_scores = genre_scores / total
    
    genre_preferences = {
        genre: float(score) 
        for genre, score in zip(unique_genres, genre_scores)
        if score > 0
    }
    
    genre_preferences = {k: v for k, v in sorted(
        genre_preferences.items(), key=lambda item: item[1], reverse=True
    )}
    
    return genre_preferences

def calculate_similarity_to_profiles(user_vector, profiles):
    """Calculează similaritatea între un vector de utilizator și profile predefinite."""
    similarities = {}
    
    for profile_name, profile_vector in profiles.items():
        
        dot_product = np.dot(user_vector, profile_vector)
        user_norm = np.linalg.norm(user_vector)
        profile_norm = np.linalg.norm(profile_vector)
        
        if user_norm > 0 and profile_norm > 0:
            similarity = dot_product / (user_norm * profile_norm)
        else:
            similarity = 0
        
        similarities[profile_name] = float(similarity)
    
    similarities = {k: v for k, v in sorted(
        similarities.items(), key=lambda item: item[1], reverse=True
    )}
    
    return similarities