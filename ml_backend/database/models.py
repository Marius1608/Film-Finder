
from sqlalchemy import Column, Integer, String, Float, Text, Date, ForeignKey, DateTime, Numeric, Boolean, Enum
from sqlalchemy.orm import relationship
from database.connection import Base
import datetime


class Movie(Base):
    __tablename__ = 'movies'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    year = Column(Integer)
    imdb_id = Column(String(20))
    tmdb_id = Column(Integer)
    genres = Column(String(255))
    overview = Column(Text)
    poster_path = Column(String(255))
    vote_average = Column(Float)
    popularity = Column(Float)
    release_date = Column(Date)
    runtime = Column(Integer)

    ratings = relationship("Rating", back_populates="movie", cascade="all, delete-orphan")
    links = relationship("MovieLink", back_populates="movie", uselist=False)


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    ratings = relationship("Rating", back_populates="user", cascade="all, delete-orphan")


class Rating(Base):
    __tablename__ = 'ratings'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    movie_id = Column(Integer, ForeignKey('movies.id'), nullable=False)
    rating = Column(Numeric(2, 1), nullable=False)
    timestamp = Column(DateTime, nullable=False)

    app_user_id = Column(Integer, ForeignKey('users_application.id'), nullable=True)
    app_user = relationship("UserApplication", backref="movie_ratings")

    user = relationship("User", back_populates="ratings")
    movie = relationship("Movie", back_populates="ratings")


class MovieSimilarity(Base):
    __tablename__ = 'movie_similarities'

    id = Column(Integer, primary_key=True, index=True)
    movie_id1 = Column(Integer, ForeignKey('movies.id'), nullable=False)
    movie_id2 = Column(Integer, ForeignKey('movies.id'), nullable=False)
    similarity_score = Column(Float)


class MovieLink(Base):
    __tablename__ = 'movie_links'

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey('movies.id'), nullable=False)
    imdb_id = Column(String(20), nullable=True)
    tmdb_id = Column(Integer, nullable=True)

    movie = relationship("Movie", back_populates="links")


class UserApplication(Base):
    __tablename__ = 'users_application'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime)

    watchlist = relationship("Watchlist", back_populates="user_app")
    collections = relationship("Collection", back_populates="user_app")
    movie_statuses = relationship("MovieStatus", back_populates="user_app")
    app_ratings = relationship("AppRating", back_populates="user_app")

class Watchlist(Base):
    __tablename__ = 'watchlist'

    id = Column(Integer, primary_key=True, index=True)
    user_app_id = Column(Integer, ForeignKey('users_application.id'))
    movie_id = Column(Integer, ForeignKey('movies.id'))
    added_at = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(Text, nullable=True)
    priority = Column(Integer, default=0)

    user_app = relationship("UserApplication", back_populates="watchlist")
    movie = relationship("Movie")


class MovieStatus(Base):
    __tablename__ = 'movie_status'

    id = Column(Integer, primary_key=True, index=True)
    user_app_id = Column(Integer, ForeignKey('users_application.id'))
    movie_id = Column(Integer, ForeignKey('movies.id'))
    status = Column(Enum('watching', 'completed', 'dropped', 'plan_to_watch'))
    score = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

    user_app = relationship("UserApplication")
    movie = relationship("Movie")


class Collection(Base):
    __tablename__ = 'collections'

    id = Column(Integer, primary_key=True, index=True)
    user_app_id = Column(Integer, ForeignKey('users_application.id'))
    name = Column(String(255))
    description = Column(Text)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user_app = relationship("UserApplication", back_populates="collections")
    movies = relationship("CollectionMovie", back_populates="collection")


class AppRating(Base):
    __tablename__ = 'app_ratings'

    id = Column(Integer, primary_key=True, index=True)
    user_app_id = Column(Integer, ForeignKey('users_application.id'), nullable=False)
    movie_id = Column(Integer, ForeignKey('movies.id'), nullable=False)
    rating = Column(Numeric(2, 1), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    review_text = Column(Text, nullable=True)

    user_app = relationship("UserApplication", back_populates="app_ratings")
    movie = relationship("Movie")


class CollectionMovie(Base):
    __tablename__ = 'collection_movies'

    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey('collections.id'))
    movie_id = Column(Integer, ForeignKey('movies.id'))
    added_at = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(Text, nullable=True)

    collection = relationship("Collection", back_populates="movies")
    movie = relationship("Movie")


class Notification(Base):
    __tablename__ = 'notifications'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users_application.id'), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(Enum('info', 'success', 'warning', 'error'), default='info')
    read = Column(Boolean, default=False)
    notification_metadata = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("UserApplication", backref="notifications")


class UserProfile(Base):
    __tablename__ = 'user_profiles'

    user_id = Column(Integer, ForeignKey('users_application.id'), primary_key=True)
    favorite_genres = Column(Text)  # Stocat ca JSON
    avg_rating = Column(Float)
    rating_count = Column(Integer)
    rating_variance = Column(Float)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("UserApplication", backref="profile", uselist=False)


class UserPreferences(Base):
    __tablename__ = 'user_preferences'

    user_id = Column(Integer, ForeignKey('users_application.id'), primary_key=True)
    dark_mode = Column(Boolean, default=False)
    email_notifications = Column(Boolean, default=True)
    language = Column(String(10), default='en')
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("UserApplication", backref="preferences", uselist=False)