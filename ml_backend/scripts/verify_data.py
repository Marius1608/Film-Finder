from database.connection import SessionLocal
from database.models import Movie, Rating, User, MovieLink
import pandas as pd
from sqlalchemy import func


def verify_data():
    session = SessionLocal()
    try:
        print("\n=== VERIFICARE DATE ÎNCĂRCATE ===\n")

        movie_count = session.query(Movie).count()
        print(f"📊 Total filme în baza de date: {movie_count}")

        print("\n📽️ Primele 5 filme:")
        movies = session.query(Movie).limit(5).all()
        for movie in movies:
            print(f"  ID: {movie.id}, Titlu: {movie.title}, An: {movie.year}, Genuri: {movie.genres}")
            print(f"     IMDb ID: {movie.imdb_id}, TMDb ID: {movie.tmdb_id}")
            print("  " + "-" * 50)

        user_count = session.query(User).count()
        print(f"\n👥 Total utilizatori: {user_count}")

        rating_count = session.query(Rating).count()
        print(f"\n⭐ Total rating-uri: {rating_count}")

        link_count = session.query(MovieLink).count()
        print(f"\n🔗 Total link-uri: {link_count}")

        print("\n📈 Primele 5 rating-uri:")
        ratings = session.query(Rating).limit(5).all()
        for rating in ratings:
            movie = session.query(Movie).filter(Movie.id == rating.movie_id).first()
            print(
                f"  User {rating.user_id} a dat {rating.rating} stele pentru '{movie.title if movie else 'Film necunoscut'}'")

        print("\n📊 Statistici pe genuri:")
        movies_data = []
        for movie in session.query(Movie).all():
            if movie.genres:
                for genre in movie.genres.split('|'):
                    movies_data.append({'genre': genre})

        if movies_data:
            df = pd.DataFrame(movies_data)
            genre_counts = df['genre'].value_counts()
            print("\nTop 10 genuri:")
            for genre, count in genre_counts.head(10).items():
                print(f"  {genre}: {count} filme")

        print("\n🔍 Verificare completitudine date:")
        movies_without_links = session.query(Movie).outerjoin(MovieLink).filter(MovieLink.id == None).count()
        print(f"  Filme fără link-uri: {movies_without_links}")

        movies_without_imdb = session.query(Movie).filter(Movie.imdb_id == None).count()
        print(f"  Filme fără IMDb ID: {movies_without_imdb}")

        movies_without_tmdb = session.query(Movie).filter(Movie.tmdb_id == None).count()
        print(f"  Filme fără TMDb ID: {movies_without_tmdb}")

        print("\n⭐ Distribuția rating-urilor:")
        ratings_data = session.query(Rating.rating,
                                     func.count(Rating.id).label('count')) \
            .group_by(Rating.rating) \
            .order_by(Rating.rating).all()

        for rating, count in ratings_data:
            print(f"  Rating {rating}: {count} rating-uri")

        print("\n✅ Verificare completă!")

    except Exception as e:
        print(f"❌ Eroare: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()


if __name__ == "__main__":
    verify_data()