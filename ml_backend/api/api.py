import os
import openai
import logging
from datetime import datetime, timedelta
from pydoc import text

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, json
from typing import List, Optional, Dict

from sqlalchemy import func
from sqlalchemy.testing import db
from starlette import status

from auth.auth import verify_password, ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, get_password_hash, \
    get_current_user
from database.models import UserApplication, AppRating, Movie, Watchlist, Notification, UserProfile
from machine_learning.RecommendationEngine import RecommendationEngine
from database.connection import get_db
from sqlalchemy.orm import Session
from groq import Groq


load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY
else:
    print("Warning: OPENAI_API_KEY not found in environment variables")


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
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

class ChatQuestionRequest(BaseModel):
    movie_id: int
    question: str

class ChatResponse(BaseModel):
    answer: str
    source: Optional[str] = "Assistant"

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
    id: int
    title: str
    year: Optional[int] = None
    genres: Optional[str] = None
    average_rating: Optional[float] = None
    rating_count: Optional[int] = None
    imdb_id: Optional[str] = None
    tmdb_id: Optional[int] = None
    overview: Optional[str] = None
    poster_path: Optional[str] = None

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
    poster_path: Optional[str] = None
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
                'movie_id': result.id,
                'title': result.title,
                'year': result.year,
                'genres': result.genres,
                'average_rating': result.avg_rating,
                'rating_count': result.rating_count,
                "poster_path": result.poster_path,
                'imdb_id': result.imdb_id,
                'tmdb_id': result.tmdb_id
            }
        return None

    except Exception as e:
        logger.error(f"Error getting movie details: {e}")
        return None


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
    for item in watchlist[:5]:
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


@app.post("/chatbot/movie-details", tags=["Chatbot"], response_model=ChatResponse)
async def ask_movie_question(
        request: ChatQuestionRequest,
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db),
        engine: RecommendationEngine = Depends(get_recommendation_engine)
):
    movie = engine.get_movie_details(request.movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    movie_context = f"""
    Movie Title: {movie['title']}
    Year: {movie.get('year', 'Unknown')}
    Genres: {movie.get('genres', 'None specified')}
    Average Rating: {movie.get('average_rating', 'N/A')}
    Number of Ratings: {movie.get('rating_count', 0)}
    Overview: {movie.get('overview', 'No overview available')[:300]}...
    """

    if GROQ_API_KEY:
        try:
            client = Groq(api_key=GROQ_API_KEY)

            completion = client.chat.completions.create(
                model="llama3-8b-8192",  # or "mixtral-8x7b-32768"
                messages=[
                    {
                        "role": "system",
                        "content": f"You are a helpful movie assistant. Answer questions about {movie['title']} based on this information: {movie_context}"
                    },
                    {
                        "role": "user",
                        "content": request.question
                    }
                ],
                temperature=0.7,
                max_tokens=200,
            )

            return ChatResponse(
                answer=completion.choices[0].message.content,
                source="Groq"
            )

        except Exception as e:
            logger.error(f"Groq API error: {str(e)}")

    question_lower = request.question.lower()

    if any(word in question_lower for word in ["hello", "hi", "hey", "greetings"]):
        return ChatResponse(
            answer=f"Hello! I'm here to help you learn about {movie['title']}. What would you like to know? I can tell you about the plot, ratings, genres, release year, and more!",
            source="Local"
        )

    elif any(word in question_lower for word in ["plot", "story", "about", "synopsis", "summary"]):
        if 'overview' in movie and movie['overview']:
            return ChatResponse(
                answer=f"Here's what {movie['title']} is about:\n\n{movie['overview']}\n\nWould you like to know more about the genres, ratings, or similar movies?",
                source="Database"
            )
        else:
            return ChatResponse(
                answer=f"I don't have a detailed plot summary for {movie['title']} in my database. However, I can tell you it's a {movie.get('genres', 'movie')} from {movie.get('year', 'an unknown year')}.",
                source="Database"
            )

    elif any(word in question_lower for word in ["rating", "score", "good", "reviews", "popular"]):
        if movie.get('average_rating'):
            rating = movie['average_rating']
            count = movie.get('rating_count', 0)

            if rating >= 4.5:
                quality = "Outstanding! One of the highest-rated movies"
            elif rating >= 4.0:
                quality = "Excellent! Highly recommended by viewers"
            elif rating >= 3.5:
                quality = "Very good! Well-liked by most viewers"
            elif rating >= 3.0:
                quality = "Good! Solid entertainment value"
            elif rating >= 2.5:
                quality = "Average. Has its moments but mixed reviews"
            else:
                quality = "Below average. Not highly recommended"

            return ChatResponse(
                answer=f"{movie['title']} has a {rating:.1f}/5 star rating from {count:,} users. {quality}.",
                source="Database"
            )
        else:
            return ChatResponse(
                answer=f"I don't have rating information for {movie['title']} yet. It might be a newer release or less commonly rated film.",
                source="Database"
            )

    elif any(word in question_lower for word in ["genre", "type", "kind", "category"]):
        if movie.get('genres'):
            genres = movie['genres']
            return ChatResponse(
                answer=f"{movie['title']} is categorized as: {genres}. These genres help you understand what kind of movie experience to expect.",
                source="Database"
            )
        else:
            return ChatResponse(
                answer=f"I don't have genre information for {movie['title']} in my database.",
                source="Database"
            )

    # Year/Release date responses
    elif any(word in question_lower for word in ["year", "when", "released", "old", "date"]):
        if movie.get('year'):
            year = movie['year']
            current_year = 2025
            age = current_year - year

            if age <= 1:
                age_context = "It's a very recent release!"
            elif age <= 5:
                age_context = "It's a relatively recent movie."
            elif age <= 10:
                age_context = "It's from the past decade."
            elif age <= 20:
                age_context = "It's a modern classic."
            else:
                age_context = "It's a classic film."

            return ChatResponse(
                answer=f"{movie['title']} was released in {year}, making it {age} years old. {age_context}",
                source="Database"
            )
        else:
            return ChatResponse(
                answer=f"I don't have the release year for {movie['title']} in my database.",
                source="Database"
            )

    elif any(word in question_lower for word in ["watch", "similar", "recommend", "like"]):
        try:
            similar_movies = engine.hybrid_recommendations(movie['id'], limit=3)
            if similar_movies:
                titles = [m['title'] for m in similar_movies[:3]]
                return ChatResponse(
                    answer=f"If you enjoyed {movie['title']}, you might also like: {', '.join(titles)}. These movies share similar themes, genres, or have been enjoyed by viewers with similar tastes.",
                    source="Recommendations"
                )
        except:
            pass

        return ChatResponse(
            answer=f"Check out the recommendations section below for movies similar to {movie['title']}!",
            source="Database"
        )

    # Cast/Crew responses
    elif any(word in question_lower for word in ["director", "cast", "actor", "actress", "star"]):
        return ChatResponse(
            answer=f"I don't have cast or crew information for {movie['title']} in my current database. You can find this information on IMDB or other movie databases.",
            source="Database"
        )

    elif any(word in question_lower for word in ["review", "opinion", "thoughts", "think"]):
        if movie.get('average_rating'):
            rating = movie['average_rating']
            count = movie.get('rating_count', 0)

            if rating >= 4.0:
                opinion = f"Users love {movie['title']}! With a {rating:.1f} rating from {count} reviews, it's highly recommended."
            elif rating >= 3.5:
                opinion = f"Users really enjoy {movie['title']}. With a {rating:.1f} rating from {count} reviews, it's well-received."
            elif rating >= 3.0:
                opinion = f"{movie['title']} has mixed to positive reviews. With a {rating:.1f} rating from {count} users, it's worth checking out if you like {movie.get('genres', 'this type of movie')}."
            else:
                opinion = f"{movie['title']} has mixed reviews with a {rating:.1f} rating from {count} users. It might appeal to specific tastes."

            return ChatResponse(
                answer=opinion,
                source="Database"
            )
        else:
            return ChatResponse(
                answer=f"I don't have user reviews for {movie['title']} yet. Be one of the first to rate it!",
                source="Database"
            )

    elif any(word in question_lower for word in ["long", "duration", "runtime", "minutes", "hours"]):
        if movie.get('runtime'):
            runtime = movie['runtime']
            hours = runtime // 60
            minutes = runtime % 60

            if hours > 0:
                duration_str = f"{hours} hour{'s' if hours > 1 else ''} and {minutes} minutes"
            else:
                duration_str = f"{minutes} minutes"

            return ChatResponse(
                answer=f"{movie['title']} has a runtime of {duration_str}.",
                source="Database"
            )
        else:
            return ChatResponse(
                answer=f"I don't have runtime information for {movie['title']} in my database.",
                source="Database"
            )

    elif any(word in question_lower for word in
             ["where", "stream", "watch", "available", "netflix", "amazon", "disney"]):
        return ChatResponse(
            answer=f"I don't have streaming availability information for {movie['title']}. You can check JustWatch, Reelgood, or the streaming services directly to see where it's currently available.",
            source="Database"
        )

    else:
        info_parts = [f"Here's what I know about {movie['title']}:"]

        if movie.get('year'):
            info_parts.append(f"• Released: {movie['year']}")
        if movie.get('genres'):
            info_parts.append(f"• Genres: {movie['genres']}")
        if movie.get('average_rating'):
            info_parts.append(f"• Rating: {movie['average_rating']:.1f}/5 ({movie.get('rating_count', 0)} ratings)")
        if movie.get('overview'):
            info_parts.append(f"• Plot: {movie['overview'][:200]}{'...' if len(movie['overview']) > 200 else ''}")

        info_parts.append("\nWhat specific information would you like to know?")

        return ChatResponse(
            answer="\n".join(info_parts),
            source="Database"
        )

@app.get("/api/status")
async def get_api_status():

    status = {
        "openai": {
            "configured": bool(OPENAI_API_KEY),
            "key_length": len(OPENAI_API_KEY) if OPENAI_API_KEY else 0,
            "status": "unknown"
        },
        "groq": {
            "configured": bool(GROQ_API_KEY),
            "key_length": len(GROQ_API_KEY) if GROQ_API_KEY else 0,
            "status": "unknown"
        }
    }

    if OPENAI_API_KEY:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "test"}],
                max_tokens=1
            )
            status["openai"]["status"] = "active"
        except Exception as e:
            if "insufficient_quota" in str(e):
                status["openai"]["status"] = "quota_exceeded"
            else:
                status["openai"]["status"] = f"error: {str(e)[:50]}"

    if GROQ_API_KEY:
        try:
            from groq import Groq
            client = Groq(api_key=GROQ_API_KEY)
            response = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[{"role": "user", "content": "test"}],
                max_tokens=1
            )
            status["groq"]["status"] = "active"
        except Exception as e:
            status["groq"]["status"] = f"error: {str(e)[:50]}"

    return status



@app.get("/movies/all", response_model=List[MovieResponse], tags=["Movies"])
async def get_all_movies(
        limit: int = 100,
        skip: int = 0,
        sort_by: str = "popularity",
        engine: RecommendationEngine = Depends(get_recommendation_engine)
):
    try:
        query = text("""
            SELECT m.id as movie_id, m.title, m.year, m.genres, m.overview, m.poster_path,
                   ms.avg_rating, ms.rating_count
            FROM movies m
            LEFT JOIN movie_stats ms ON m.id = ms.movie_id
            ORDER BY 
                CASE WHEN :sort_by = 'title' THEN m.title END ASC,
                CASE WHEN :sort_by = 'year' THEN m.year END DESC,
                CASE WHEN :sort_by = 'rating' THEN ms.avg_rating END DESC,
                CASE WHEN :sort_by = 'popularity' OR :sort_by = '' THEN 
                    (ms.avg_rating * LOG(ms.rating_count + 1)) 
                END DESC
            LIMIT :limit OFFSET :skip
        """)

        results = engine.session.execute(query, {
            "sort_by": sort_by,
            "limit": limit,
            "skip": skip
        }).fetchall()

        movies = []
        for row in results:
            movies.append({
                'movie_id': row.movie_id,
                'title': row.title,
                'year': row.year,
                'genres': row.genres,
                'overview': row.overview,
                'poster_path': row.poster_path,
                'average_rating': row.avg_rating,
                'rating_count': row.rating_count
            })

        return movies

    except Exception as e:
        logger.error(f"Error getting all movies: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving movies")


router = APIRouter()


@router.get("/watchlist/check/{movie_id}", tags=["Watchlist"])
async def check_watchlist_status(
        movie_id: int,
        current_user=Depends(get_current_user),
        db: Session = Depends(get_db)
):

    watchlist_item = db.query(Watchlist).filter(
        Watchlist.user_app_id == current_user.id,
        Watchlist.movie_id == movie_id
    ).first()

    return {"in_watchlist": watchlist_item is not None}


@router.get("/users/{user_id}/ratings/{movie_id}", tags=["Ratings"])
async def get_user_rating(
        user_id: int,
        movie_id: int,
        db: Session = Depends(get_db)
):

    from database.models import Rating

    rating = db.query(Rating).filter(
        Rating.user_id == user_id,
        Rating.movie_id == movie_id
    ).first()

    app_rating = db.query(AppRating).filter(
        AppRating.user_app_id == user_id,
        AppRating.movie_id == movie_id
    ).first()

    if rating:
        return {
            "user_id": rating.user_id,
            "movie_id": rating.movie_id,
            "rating": float(rating.rating),
            "timestamp": rating.timestamp
        }
    elif app_rating:
        return {
            "user_id": app_rating.user_app_id,
            "movie_id": app_rating.movie_id,
            "rating": float(app_rating.rating),
            "timestamp": app_rating.timestamp
        }
    else:
        return {
            "user_id": user_id,
            "movie_id": movie_id,
            "rating": None,
            "timestamp": None
        }


@app.post("/notifications", tags=["Notifications"])
async def create_notification(
        title: str,
        message: str,
        type: str = "info",
        metadata: str = None,
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    notification = Notification(
        user_id=current_user.id,
        title=title,
        message=message,
        type=type,
        metadata=metadata
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)
    return {"message": "Notification created", "id": notification.id}


@app.post("/notifications", tags=["Notifications"])
async def create_notification(
        title: str,
        message: str,
        type: str = "info",
        metadata: str = None,
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    notification = Notification(
        user_id=current_user.id,
        title=title,
        message=message,
        type=type,
        notification_metadata=metadata
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)
    return {"message": "Notification created", "id": notification.id}


@app.get("/notifications", tags=["Notifications"])
async def get_notifications(
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()

    result = []
    for notification in notifications:
        result.append({
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "read": notification.read,
            "created_at": notification.created_at,
            "metadata": notification.notification_metadata
        })

    return result


@app.get("/notifications/check-daily", tags=["Notifications"])
async def check_daily_notifications(
        date: str,
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    today_start = datetime.strptime(date, "%Y-%m-%d")
    today_end = today_start + timedelta(days=1)

    existing = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.created_at >= today_start,
        Notification.created_at < today_end,
        Notification.notification_metadata.like('%"type":"daily_recommendations"%')
    ).first()

    return {"sent": existing is not None}


@app.post("/users/recommendations/daily", tags=["Recommendations"])
async def get_daily_recommendations(
        seed: str,
        limit: int = 3,
        current_user: UserApplication = Depends(get_current_user),
        engine: RecommendationEngine = Depends(get_recommendation_engine)
):

    recommendations = []

    personal_recs = engine.personalized_recommendations(current_user.id, limit)
    if personal_recs:
        recommendations.extend(personal_recs[:1])

    if len(recommendations) < limit:
        popular_recs = engine.get_popular_movies(limit * 2)
        popular_recs = [r for r in popular_recs if not any(rec['movie_id'] == r['movie_id'] for rec in recommendations)]
        recommendations.extend(popular_recs[:limit - len(recommendations)])

    if len(recommendations) < limit:

        user_profile = await get_user_profile(current_user.id, db)
        if user_profile and user_profile.get('favorite_genres'):
            genres = list(user_profile['favorite_genres'].keys())[:2]  # Top 2 genuri
            for genre in genres:
                if len(recommendations) >= limit:
                    break

                genre_recs = await search_by_genre(genre, limit * 2, engine)
                genre_recs = [r for r in genre_recs if
                              not any(rec['movie_id'] == r['movie_id'] for rec in recommendations)]
                recommendations.extend(genre_recs[:1])

    return recommendations[:limit]


async def get_user_profile(user_id: int, db: Session):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if profile and profile.favorite_genres:
        try:
            return {
                'favorite_genres': json.loads(profile.favorite_genres),
                'avg_rating': profile.avg_rating,
                'rating_count': profile.rating_count
            }
        except:
            pass
    return None


async def search_by_genre(genre: str, limit: int, engine: RecommendationEngine):
    try:
        return engine.search_movies(genre, limit)
    except:
        return []


@app.get("/notifications/scheduled", tags=["Notifications"])
async def check_and_generate_scheduled_notifications(
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db),
        engine: RecommendationEngine = Depends(get_recommendation_engine)
):
    try:
        last_notification = db.query(Notification) \
            .filter(Notification.user_id == current_user.id) \
            .order_by(Notification.created_at.desc()) \
            .first()

        should_generate = True
        if last_notification:
            now = datetime.utcnow()
            last_notification_time = last_notification.created_at
            time_diff = now - last_notification_time

            if time_diff.total_seconds() < 30 * 60:
                should_generate = False

        if should_generate:
            recommendations = engine.personalized_recommendations(current_user.id, 3)

            if not recommendations:
                recommendations = engine.get_popular_movies(3)

            metadata = {
                "type": "daily_recommendations",
                "movies": [
                    {"id": rec["movie_id"], "title": rec["title"]}
                    for rec in recommendations[:3]
                ]
            }

            notification = Notification(
                user_id=current_user.id,
                title="New Movie Recommendations",
                message="We've found some movies you might enjoy!",
                type="info",
                notification_metadata=json.dumps(metadata)
            )

            db.add(notification)
            db.commit()
            db.refresh(notification)

            return {"success": True, "notification_generated": True, "notification_id": notification.id}

        return {"success": True, "notification_generated": False, "message": "Too soon for a new notification"}

    except Exception as e:
        logger.error(f"Error checking/generating scheduled notifications: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process scheduled notifications: {str(e)}")


@app.get("/test-notification", tags=["Notifications"])
async def create_test_notification(
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    try:
        engine = RecommendationEngine()
        recommendations = engine.get_popular_movies(3)

        metadata = {
            "type": "test_recommendations",
            "movies": [
                {"id": rec["movie_id"], "title": rec["title"]}
                for rec in recommendations[:3]
            ]
        }

        notification = Notification(
            user_id=current_user.id,
            title="Film Recommendations",
            message="Here are some movie recommendations for you!",
            type="info",
            notification_metadata=json.dumps(metadata)
        )

        db.add(notification)
        db.commit()
        db.refresh(notification)

        return {"success": True, "notification_id": notification.id}
    except Exception as e:
        logger.error(f"Error creating test notification: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create notification: {str(e)}")


@router.delete("/notifications/{notification_id}", tags=["Notifications"])
async def delete_notification(
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

    db.delete(notification)
    db.commit()

    return {"message": "Notification deleted successfully"}


@router.delete("/notifications", tags=["Notifications"])
async def delete_all_notifications(
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).all()

    count = len(notifications)

    for notification in notifications:
        db.delete(notification)

    db.commit()

    return {"message": f"{count} notifications deleted successfully"}


@router.delete("/notifications/read", tags=["Notifications"])
async def delete_read_notifications(
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    read_notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == True
    ).all()

    count = len(read_notifications)

    for notification in read_notifications:
        db.delete(notification)

    db.commit()

    return {"message": f"{count} read notifications deleted successfully"}


@app.delete("/notifications/{notification_id}", tags=["Notifications"])
async def delete_notification(
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

    db.delete(notification)
    db.commit()

    return {"message": "Notification deleted successfully"}


@app.delete("/notifications", tags=["Notifications"])
async def delete_all_notifications(
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db)
):

    result = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).delete(synchronize_session=False)

    db.commit()

    return {"message": f"{result} notifications deleted successfully"}


@app.delete("/notifications/read", tags=["Notifications"])
async def delete_read_notifications(
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    result = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == True
    ).delete(synchronize_session=False)

    db.commit()

    return {"message": f"{result} read notifications deleted successfully"}


@app.post("/notifications/mark-all-read", tags=["Notifications"])
async def mark_all_notifications_read(
        current_user: UserApplication = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    result = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).update({"read": True}, synchronize_session=False)

    db.commit()

    return {"message": f"{result} notifications marked as read"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)