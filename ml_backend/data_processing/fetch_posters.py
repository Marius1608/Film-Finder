import requests
import os
from dotenv import load_dotenv
from database.connection import SessionLocal
from database.models import Movie
import time

load_dotenv()

TMDB_API_KEY = os.getenv('TMDB_API_KEY', 'eb66dab773708ea19e3140e36407f9bf')
TMDB_BASE_URL = 'https://api.themoviedb.org/3'


def get_tmdb_movie_details(movie_title, year=None):
    try:
        url = f"{TMDB_BASE_URL}/search/movie"
        params = {
            'api_key': TMDB_API_KEY,
            'query': movie_title,
            'year': year if year else None
        }

        response = requests.get(url, params=params)
        response.raise_for_status()

        data = response.json()
        if data['results']:
            return data['results'][0]
        return None

    except Exception as e:
        print(f"Error fetching TMDB data for {movie_title}: {e}")
        return None


def update_movie_posters():
    session = SessionLocal()
    try:
        movies = session.query(Movie).filter(Movie.poster_path.is_(None)).all()

        print(f"Found {len(movies)} movies without posters")

        for i, movie in enumerate(movies):
            if i > 0:
                time.sleep(0.5)

            print(f"Processing {i + 1}/{len(movies)}: {movie.title}")

            tmdb_data = get_tmdb_movie_details(movie.title, movie.year)

            if tmdb_data and tmdb_data.get('poster_path'):
                movie.poster_path = tmdb_data['poster_path']
                if not movie.overview and tmdb_data.get('overview'):
                    movie.overview = tmdb_data['overview']
                if not movie.vote_average and tmdb_data.get('vote_average'):
                    movie.vote_average = tmdb_data['vote_average']
                if not movie.tmdb_id and tmdb_data.get('id'):
                    movie.tmdb_id = tmdb_data['id']

                print(f"  ✓ Updated {movie.title}")
            else:
                print(f"  ✗ No poster found for {movie.title}")

        session.commit()
        print("All movies processed successfully!")

    except Exception as e:
        session.rollback()
        print(f"Error updating movie posters: {e}")
    finally:
        session.close()


if __name__ == "__main__":
    if not TMDB_API_KEY:
        print("Error: Please set TMDB_API_KEY in your .env file")
    else:
        update_movie_posters()