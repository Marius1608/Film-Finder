import numpy as np
import pandas as pd
from sqlalchemy import text
from database.connection import SessionLocal
import json
import logging
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Optional, Tuple

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class RecommendationEngine:
    def __init__(self):
        self.session = SessionLocal()
        self.engine = self.session.bind

    def get_movie_details(self, movie_id: int) -> Dict:
        try:
            query = text("""
                SELECT m.*, ms.avg_rating, ms.rating_count
                FROM movies m
                LEFT JOIN movie_stats ms ON m.id = ms.movie_id
                WHERE m.id = :movie_id
            """)
            result = self.session.execute(query, {"movie_id": movie_id}).first()

            if result:
                return {
                    'id': result.id,
                    'title': result.title,
                    'year': result.year,
                    'genres': result.genres,
                    'average_rating': result.avg_rating,
                    'rating_count': result.rating_count,
                    'imdb_id': result.imdb_id,
                    'tmdb_id': result.tmdb_id
                }
            return None

        except Exception as e:
            logger.error(f"Eroare la obținerea detaliilor filmului: {e}")
            return None

    def collaborative_filtering_recommendations(self, movie_id: int, limit: int = 10) -> List[Dict]:
        try:
            query = text("""
                SELECT ms.movie_id2 as similar_movie_id, ms.similarity_score,
                       m.title, m.year, m.genres, mst.avg_rating, mst.rating_count
                FROM movie_similarity ms
                JOIN movies m ON ms.movie_id2 = m.id
                LEFT JOIN movie_stats mst ON m.id = mst.movie_id
                WHERE ms.movie_id1 = :movie_id AND ms.method = 'item_collaborative'
                ORDER BY ms.similarity_score DESC
                LIMIT :limit
            """)

            results = self.session.execute(query, {"movie_id": movie_id, "limit": limit}).fetchall()

            recommendations = []
            for row in results:
                recommendations.append({
                    'movie_id': row.similar_movie_id,
                    'title': row.title,
                    'year': row.year,
                    'genres': row.genres,
                    'similarity_score': row.similarity_score,
                    'average_rating': row.avg_rating,
                    'rating_count': row.rating_count,
                    'method': 'collaborative_filtering'
                })

            return recommendations

        except Exception as e:
            logger.error(f"Eroare la recomandări collaborative filtering: {e}")
            return []

    def content_based_recommendations(self, movie_id: int, limit: int = 10) -> List[Dict]:
        try:
            query = text("""
                SELECT ms.movie_id2 as similar_movie_id, ms.similarity_score,
                       m.title, m.year, m.genres, mst.avg_rating, mst.rating_count
                FROM movie_similarity ms
                JOIN movies m ON ms.movie_id2 = m.id
                LEFT JOIN movie_stats mst ON m.id = mst.movie_id
                WHERE ms.movie_id1 = :movie_id AND ms.method = 'genre'
                ORDER BY ms.similarity_score DESC
                LIMIT :limit
            """)

            results = self.session.execute(query, {"movie_id": movie_id, "limit": limit}).fetchall()

            recommendations = []
            for row in results:
                recommendations.append({
                    'movie_id': row.similar_movie_id,
                    'title': row.title,
                    'year': row.year,
                    'genres': row.genres,
                    'similarity_score': row.similarity_score,
                    'average_rating': row.avg_rating,
                    'rating_count': row.rating_count,
                    'method': 'content_based'
                })

            return recommendations

        except Exception as e:
            logger.error(f"Eroare la recomandări content-based: {e}")
            return []

    def hybrid_recommendations(self, movie_id: int, limit: int = 10,
                               collaborative_weight: float = 0.6,
                               content_weight: float = 0.4) -> List[Dict]:
        try:
            cf_recs = self.collaborative_filtering_recommendations(movie_id, limit * 2)

            cb_recs = self.content_based_recommendations(movie_id, limit * 2)

            movie_scores = {}

            for rec in cf_recs:
                movie_scores[rec['movie_id']] = {
                    'collaborative_score': rec['similarity_score'],
                    'content_score': 0,
                    'hybrid_score': rec['similarity_score'] * collaborative_weight,
                    'details': rec
                }

            for rec in cb_recs:
                if rec['movie_id'] in movie_scores:
                    movie_scores[rec['movie_id']]['content_score'] = rec['similarity_score']
                    movie_scores[rec['movie_id']]['hybrid_score'] += rec['similarity_score'] * content_weight
                else:
                    movie_scores[rec['movie_id']] = {
                        'collaborative_score': 0,
                        'content_score': rec['similarity_score'],
                        'hybrid_score': rec['similarity_score'] * content_weight,
                        'details': rec
                    }

            # Sortează după scorul hibrid
            sorted_movies = sorted(
                movie_scores.items(),
                key=lambda x: x[1]['hybrid_score'],
                reverse=True
            )[:limit]

            # Formează lista de recomandări
            recommendations = []
            for movie_id, scores in sorted_movies:
                rec = scores['details']
                rec['hybrid_score'] = scores['hybrid_score']
                rec['method'] = 'hybrid'
                recommendations.append(rec)

            return recommendations

        except Exception as e:
            logger.error(f"Eroare la recomandări hibride: {e}")
            return []

    def personalized_recommendations(self, user_id: int, limit: int = 10) -> List[Dict]:
        try:
            query = text("""
                SELECT favorite_genres, avg_rating, rating_count
                FROM user_profiles
                WHERE user_id = :user_id
            """)
            user_profile = self.session.execute(query, {"user_id": user_id}).first()

            if not user_profile:
                return self.get_popular_movies(limit)

            favorite_genres = json.loads(user_profile.favorite_genres.replace("'", '"'))

            query = text("""
                SELECT movie_id
                FROM ratings
                WHERE user_id = :user_id
            """)
            rated_movies = [row.movie_id for row in self.session.execute(query, {"user_id": user_id})]

            recommendations = []
            for movie_id in rated_movies[:5]:
                movie_recs = self.hybrid_recommendations(movie_id, 5)
                recommendations.extend(movie_recs)

            recommendations = [r for r in recommendations if r['movie_id'] not in rated_movies]

            for rec in recommendations:
                if rec['genres']:
                    genre_match_score = 0
                    for genre in rec['genres'].split('|'):
                        if genre in favorite_genres:
                            genre_match_score += favorite_genres[genre]
                    rec['final_score'] = rec['hybrid_score'] * (1 + genre_match_score / 100)
                else:
                    rec['final_score'] = rec['hybrid_score']

            recommendations.sort(key=lambda x: x['final_score'], reverse=True)

            return recommendations[:limit]

        except Exception as e:
            logger.error(f"Eroare la recomandări personalizate: {e}")
            return []

    def get_popular_movies(self, limit: int = 10) -> List[Dict]:
        try:
            query = text("""
                SELECT m.id as movie_id, m.title, m.year, m.genres,
                       ms.avg_rating, ms.rating_count,
                       (ms.avg_rating * LOG(ms.rating_count + 1)) as popularity_score
                FROM movies m
                JOIN movie_stats ms ON m.id = ms.movie_id
                WHERE ms.rating_count > 10
                ORDER BY popularity_score DESC
                LIMIT :limit
            """)

            results = self.session.execute(query, {"limit": limit}).fetchall()

            recommendations = []
            for row in results:
                recommendations.append({
                    'movie_id': row.movie_id,
                    'title': row.title,
                    'year': row.year,
                    'genres': row.genres,
                    'average_rating': row.avg_rating,
                    'rating_count': row.rating_count,
                    'popularity_score': row.popularity_score,
                    'method': 'popular'
                })

            return recommendations

        except Exception as e:
            logger.error(f"Eroare la obținerea filmelor populare: {e}")
            return []

    def search_movies(self, query: str, limit: int = 10) -> List[Dict]:
        try:
            search_pattern = f"%{query}%"
            sql_query = text("""
                SELECT m.id as movie_id, m.title, m.year, m.genres,
                       ms.avg_rating, ms.rating_count
                FROM movies m
                LEFT JOIN movie_stats ms ON m.id = ms.movie_id
                WHERE m.title LIKE :query 
                   OR m.genres LIKE :query
                ORDER BY ms.rating_count DESC NULLS LAST,
                         ms.avg_rating DESC NULLS LAST
                LIMIT :limit
            """)

            results = self.session.execute(sql_query, {
                "query": search_pattern,
                "limit": limit
            }).fetchall()

            search_results = []
            for row in results:
                search_results.append({
                    'movie_id': row.movie_id,
                    'title': row.title,
                    'year': row.year,
                    'genres': row.genres,
                    'average_rating': row.avg_rating,
                    'rating_count': row.rating_count
                })

            return search_results

        except Exception as e:
            logger.error(f"Eroare la căutare filme: {e}")
            return []

    def close(self):
        self.session.close()


if __name__ == "__main__":
    engine = RecommendationEngine()
    try:
        movie_id = 1  # Toy Story (1995)
        print("\nDetalii film:")
        movie_details = engine.get_movie_details(movie_id)
        print(json.dumps(movie_details, indent=2))

        print("\nRecomandări collaborative filtering:")
        cf_recs = engine.collaborative_filtering_recommendations(movie_id)
        for rec in cf_recs:
            print(f"{rec['title']} - Similaritate: {rec['similarity_score']:.2f}")

        print("\nRecomandări content-based:")
        cb_recs = engine.content_based_recommendations(movie_id)
        for rec in cb_recs:
            print(f"{rec['title']} - Similaritate: {rec['similarity_score']:.2f}")

        print("\nRecomandări hibride:")
        hybrid_recs = engine.hybrid_recommendations(movie_id)
        for rec in hybrid_recs:
            print(f"{rec['title']} - Scor hibrid: {rec['hybrid_score']:.2f}")

        print("\nFilme populare:")
        popular = engine.get_popular_movies()
        for movie in popular:
            print(f"{movie['title']} - Rating: {movie['average_rating']:.2f}, Count: {movie['rating_count']}")

    finally:
        engine.close()