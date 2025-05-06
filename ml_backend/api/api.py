from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict

from sqlalchemy import func
from starlette import status

from auth.auth import verify_password, ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, get_password_hash, \
    get_current_user
from database.models import UserApplication, AppRating, Movie, Watchlist, Notification
from machine_learning.RecommendationEngine import RecommendationEngine
from database.connection import get_db
from sqlalchemy.orm import Session
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Movie Recommendation API",
    description="API pentru recomandarea filmelor",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MovieRecommendationRequest(BaseModel):
    method: str = "hybrid"
    limit: int = 10


class PersonalizedRecommendationRequest(BaseModel):
    limit: int = 10


class SearchRequest(BaseModel):
    query: str
    limit: int = 10


class RatingRequest(BaseModel):
    movie_id: int
    rating: float


class MovieResponse(BaseModel):
    movie_id: int
    title: str
    year: Optional[int]
    genres: Optional[str]
    average_rating: Optional[float]
    rating_count: Optional[int]

    class Config:
        from_attributes = True


class RecommendationResponse(BaseModel):
    movie_id: int
    title: str
    year: Optional[int] = None
    genres: Optional[str] = None
    similarity_score: Optional[float] = None
    hybrid_score: Optional[float] = None
    average_rating: Optional[float] = None
    rating_count: Optional[int] = None
    method: str

    class Config:
        from_attributes = True


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


def get_recommendation_engine():
    engine = RecommendationEngine()
    try:
        yield engine
    finally:
        engine.close()


# Endpoints
@app.get("/", tags=["Health"])
async def root():
    return {"status": "healthy", "message": "Movie Recommendation API"}


@app.get("/movies/popular", response_model=List[RecommendationResponse], tags=["Movies"])
async def get_popular_movies(
        limit: int = 10,
        engine: RecommendationEngine = Depends(get_recommendation_engine)
):
    popular_movies = engine.get_popular_movies(limit)
    return popular_movies


@app.get("/movies/{movie_id}", response_model=MovieResponse, tags=["Movies"])
async def get_movie(movie_id: int, engine: RecommendationEngine = Depends(get_recommendation_engine)):
    movie = engine.get_movie_details(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Film not found")
    return movie


@app.post("/movies/{movie_id}/recommendations", response_model=List[RecommendationResponse], tags=["Recommendations"])
async def get_movie_recommendations(
        movie_id: int,
        request: MovieRecommendationRequest = MovieRecommendationRequest(),
        engine: RecommendationEngine = Depends(get_recommendation_engine)
):
    movie = engine.get_movie_details(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Film not found")

    if request.method == "hybrid":
        recommendations = engine.hybrid_recommendations(movie_id, request.limit)
    elif request.method == "collaborative":
        recommendations = engine.collaborative_filtering_recommendations(movie_id, request.limit)
    elif request.method == "content_based":
        recommendations = engine.content_based_recommendations(movie_id, request.limit)
    else:
        raise HTTPException(status_code=400, detail="Invalid recommendation method")

    return recommendations


@app.post("/users/{user_id}/recommendations", response_model=List[RecommendationResponse], tags=["Recommendations"])
async def get_personalized_recommendations(
        user_id: int,
        request: PersonalizedRecommendationRequest = PersonalizedRecommendationRequest(),
        engine: RecommendationEngine = Depends(get_recommendation_engine)
):
    recommendations = engine.personalized_recommendations(user_id, request.limit)
    return recommendations


@app.post("/search", response_model=List[MovieResponse], tags=["Search"])
async def search_movies(
        request: SearchRequest,
        engine: RecommendationEngine = Depends(get_recommendation_engine)
):
    if not request.query:
        raise HTTPException(status_code=400, detail="Search query is required")

    results = engine.search_movies(request.query, request.limit)
    return results


@app.post("/users/{user_id}/ratings", tags=["Ratings"])
async def add_rating(
        user_id: int,
        request: RatingRequest,
        db: Session = Depends(get_db)
):
    try:
        from database.models import Rating

        existing_rating = db.query(Rating).filter(
            Rating.user_id == user_id,
            Rating.movie_id == request.movie_id
        ).first()

        if existing_rating:
            existing_rating.rating = request.rating
            existing_rating.timestamp = datetime.utcnow()
        else:
            new_rating = Rating(
                user_id=user_id,
                movie_id=request.movie_id,
                rating=request.rating,
                timestamp=datetime.utcnow()
            )
            db.add(new_rating)

        db.commit()
        return {"message": "Rating saved successfully"}

    except Exception as e:
        db.rollback()
        logger.error(f"Error saving rating: {e}")
        raise HTTPException(status_code=500, detail="Error saving rating")


@app.get("/users/{user_id}/ratings", tags=["Ratings"])
async def get_user_ratings(
        user_id: int,
        skip: int = 0,
        limit: int = 10,
        db: Session = Depends(get_db)
):
    try:
        from database.models import Rating

        ratings = db.query(Rating, Movie) \
            .join(Movie, Rating.movie_id == Movie.id) \
            .filter(Rating.user_id == user_id) \
            .offset(skip) \
            .limit(limit) \
            .all()

        result = []
        for rating, movie in ratings:
            result.append({
                "movie_id": movie.id,
                "title": movie.title,
                "year": movie.year,
                "genres": movie.genres,
                "rating": rating.rating,
                "timestamp": rating.timestamp
            })

        return result

    except Exception as e:
        logger.error(f"Error fetching user ratings: {e}")
        raise HTTPException(status_code=500, detail="Error fetching ratings")


@app.get("/stats", tags=["Stats"])
async def get_system_stats(db: Session = Depends(get_db)):
    try:
        from database.models import User, Rating

        movie_count = db.query(Movie).count()
        user_count = db.query(User).count()
        rating_count = db.query(Rating).count()

        return {
            "total_movies": movie_count,
            "total_users": user_count,
            "total_ratings": rating_count,
            "average_ratings_per_user": rating_count / user_count if user_count > 0 else 0
        }

    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail="Error fetching stats")


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {"error": exc.detail, "status_code": exc.status_code}


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return {"error": "Internal server error", "status_code": 500}


@app.post("/auth/register", response_model=dict)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(UserApplication).filter(
        UserApplication.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = get_password_hash(user_data.password)
    new_user = UserApplication(
        email=user_data.email,
        password_hash=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully", "user_id": new_user.id}


@app.post("/auth/token", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(UserApplication).filter(
        UserApplication.email == user_data.email
    ).first()

    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user.last_login = datetime.utcnow()
    db.commit()

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/auth/me")
async def get_current_user_info(current_user: UserApplication = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login
    }


@app.post("/ratings")
async def add_app_rating(
        movie_id: int,
        rating: float,
        review_text: str = None,
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    existing_rating = db.query(AppRating).filter(
        AppRating.user_app_id == current_user.id,
        AppRating.movie_id == movie_id
    ).first()

    if existing_rating:
        existing_rating.rating = rating
        existing_rating.review_text = review_text
        existing_rating.timestamp = datetime.utcnow()
    else:
        new_rating = AppRating(
            user_app_id=current_user.id,
            movie_id=movie_id,
            rating=rating,
            review_text=review_text
        )
        db.add(new_rating)

    db.commit()
    return {"message": "Rating saved successfully"}


@app.get("/my-ratings")
async def get_my_ratings(
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    ratings = db.query(AppRating, Movie).join(
        Movie, AppRating.movie_id == Movie.id
    ).filter(
        AppRating.user_app_id == current_user.id
    ).all()

    result = []
    for rating, movie in ratings:
        result.append({
            "movie_id": movie.id,
            "movie_title": movie.title,
            "year": movie.year,
            "rating": rating.rating,
            "review": rating.review_text,
            "timestamp": rating.timestamp
        })

    return result


# Notifications endpoints
@app.get("/notifications", tags=["Notifications"])
async def get_notifications(
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()

    return notifications


@app.post("/notifications/{notification_id}/mark-read", tags=["Notifications"])
async def mark_notification_read(
        notification_id: int,
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.read = True
    db.commit()
    return {"message": "Notification marked as read"}


@app.post("/notifications", tags=["Notifications"])
async def create_notification(
        title: str,
        message: str,
        type: str = "info",
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    notification = Notification(
        user_id=current_user.id,
        title=title,
        message=message,
        type=type
    )

    db.add(notification)
    db.commit()
    return {"message": "Notification created"}


# Watchlist endpoints
@app.post("/watchlist", tags=["Watchlist"])
async def add_to_watchlist(
        movie_id: int,
        priority: int = 0,
        notes: str = None,
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    existing = db.query(Watchlist).filter(
        Watchlist.user_app_id == current_user.id,
        Watchlist.movie_id == movie_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Movie already in watchlist")

    watchlist_item = Watchlist(
        user_app_id=current_user.id,
        movie_id=movie_id,
        priority=priority,
        notes=notes
    )

    db.add(watchlist_item)
    db.commit()
    return {"message": "Added to watchlist"}


@app.get("/watchlist", tags=["Watchlist"])
async def get_watchlist(
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    watchlist = db.query(Watchlist, Movie).join(
        Movie, Watchlist.movie_id == Movie.id
    ).filter(
        Watchlist.user_app_id == current_user.id
    ).all()

    return [{
        "id": wl.id,
        "movie_id": movie.id,
        "title": movie.title,
        "year": movie.year,
        "genres": movie.genres,
        "poster_path": movie.poster_path,
        "added_at": wl.added_at,
        "priority": wl.priority,
        "notes": wl.notes
    } for wl, movie in watchlist]


@app.delete("/watchlist/{item_id}", tags=["Watchlist"])
async def remove_from_watchlist(
        item_id: int,
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    watchlist_item = db.query(Watchlist).filter(
        Watchlist.id == item_id,
        Watchlist.user_app_id == current_user.id
    ).first()

    if not watchlist_item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(watchlist_item)
    db.commit()
    return {"message": "Removed from watchlist"}


@app.post("/watchlist/priority", tags=["Watchlist"])
async def update_watchlist_priority(
        movie_id: int,
        priority: int,
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    watchlist_item = db.query(Watchlist).filter(
        Watchlist.user_app_id == current_user.id,
        Watchlist.movie_id == movie_id
    ).first()

    if not watchlist_item:
        raise HTTPException(status_code=404, detail="Item not found")

    watchlist_item.priority = priority
    db.commit()
    return {"message": "Priority updated"}


@app.get("/watchlist/recommendations", tags=["Watchlist"])
async def get_watchlist_recommendations(
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db),
        engine: RecommendationEngine = Depends(get_recommendation_engine)
):
    watchlist = db.query(Watchlist).filter(
        Watchlist.user_app_id == current_user.id
    ).all()

    if not watchlist:
        return []

    recommendations = []
    for item in watchlist[:5]:  # Take first 5 movies from watchlist
        movie_recs = engine.hybrid_recommendations(item.movie_id, 3)
        recommendations.extend(movie_recs)

    return recommendations


@app.get("/user/statistics", tags=["User"])
async def get_user_statistics(
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    rating_count = db.query(AppRating).filter(
        AppRating.user_app_id == current_user.id
    ).count()

    avg_rating = db.query(func.avg(AppRating.rating)).filter(
        AppRating.user_app_id == current_user.id
    ).scalar()

    watchlist_count = db.query(Watchlist).filter(
        Watchlist.user_app_id == current_user.id
    ).count()

    return {
        "rating_count": rating_count,
        "average_rating": avg_rating,
        "watchlist_count": watchlist_count
    }


@app.post("/chatbot/movie-details", tags=["Chatbot"])
async def ask_movie_question(
        movie_id: int,
        question: str,
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db),
        engine: RecommendationEngine = Depends(get_recommendation_engine)
):
    movie = engine.get_movie_details(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    # Răspunsuri predefined pentru chat
    question_lower = question.lower()

    if "plot" in question_lower or "story" in question_lower:
        return {
            "answer": f"This movie is about {movie['title']}. Please check external sources for detailed plot information."}

    elif "rating" in question_lower:
        return {
            "answer": f"{movie['title']} has an average rating of {movie.get('average_rating', 'N/A')} based on {movie.get('rating_count', 0)} ratings."}

    elif "genre" in question_lower:
        return {
            "answer": f"{movie['title']} belongs to the following genres: {movie.get('genres', 'No genres specified')}."}

    elif "year" in question_lower or "when" in question_lower:
        return {"answer": f"{movie['title']} was released in {movie.get('year', 'Unknown year')}."}

    else:
        return {
            "answer": f"I can provide information about {movie['title']}'s rating, genres, release year, and other basic details. What would you like to know?"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)