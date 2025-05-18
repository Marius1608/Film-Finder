FilmFinder 🎬
A modern movie recommendation system built with Next.js and FastAPI that helps users discover their next favorite film through intelligent recommendations and a beautiful, interactive interface.


![Screenshot 2025-05-18 162642](https://github.com/user-attachments/assets/7140837a-cb13-46c6-a296-a70ad3b92feb)


![Screenshot 2025-05-18 162654](https://github.com/user-attachments/assets/8b6f7247-1648-4325-8d1d-2c1632ae542a)


Features ✨

Movie Discovery: Browse through a curated collection of films with advanced filtering options
Smart Recommendations: Get personalized movie suggestions using hybrid recommendation algorithms:

Collaborative Filtering: Based on what similar users enjoy
Content-Based Filtering: Based on movie attributes like genres
Hybrid Approach: Combines multiple methods for optimal suggestions


User Authentication: Secure login and registration system with JWT authentication
Watchlist Management: Save movies to watch later with priority settings
Movie Ratings: Rate movies and see community ratings with interactive star components
AI Chat Assistant: Ask questions about specific movies using AI-powered chat (Groq/OpenAI)
Notifications System: Receive daily movie recommendations and app updates
Advanced Search & Filtering: Find movies by title, genre, year, and ratings
User Profiles: Track your movie activity, statistics, and preferences
Responsive Design: Beautiful UI that works great on mobile and desktop
Dark/Light Mode: Choose your preferred color theme
Data Export: Export your ratings and watchlist data
Movie Analysis: View insights about your movie preferences and watching habits


Tech Stack 🛠️
Frontend

Next.js 15.3.1 - React framework with TypeScript
Tailwind CSS - Utility-first CSS framework
shadcn/ui - UI component library with Radix UI
TanStack Query - Data fetching, caching, and state management
Lucide Icons - Modern icon library
Axios - HTTP client
React Hook Form - Form handling
Recharts - Data visualization components

Backend

FastAPI - High-performance Python web framework
SQLAlchemy - SQL toolkit and ORM
MySQL - Relational database
scikit-learn - Machine learning for recommendations
NumPy & Pandas - Data processing
Groq API - AI-powered chat capabilities
JWT Authentication - Secure user authentication
Pydantic - Data validation
TMDB API - Movie metadata and images


Installation 🚀
Prerequisites

Node.js (v18 or higher)
Python (3.8+)
MySQL
TMDB API Key (for movie posters)
Groq API Key (optional, for AI chat)

Backend Setup

Clone the repository:

bashgit clone https://github.com/yourusername/filmfinder.git
cd filmfinder/backend

Create a virtual environment and install dependencies:

bashpython -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

Create a .env file in the backend directory:

envDB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_NAME=filmfinder_db
DB_PORT=3306

TMDB_API_KEY=your_tmdb_api_key
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key  # Optional alternative to Groq

Create the database:

sqlCREATE DATABASE filmfinder_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

Run database migrations and load initial data:

bashpython scripts/create_tables.py
python scripts/data_loader.py
python scripts/data_preprocessor.py  # Processes recommendation data
python scripts/fetch_posters.py  # Fetches movie posters from TMDB

Start the backend server:

bashuvicorn api:app --reload --host 0.0.0.0 --port 8000
Frontend Setup

Navigate to the frontend directory:

bashcd ../frontend

Install dependencies:

bashnpm install
# or
yarn install

Create a .env.local file:

envNEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
NEXT_PUBLIC_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/w500

Start the development server:

bashnpm run dev
# or
yarn dev
Visit http://localhost:3000 to see the application.
Project Structure 📁
filmfinder/
├── backend/
│   ├── api.py                  # Main FastAPI application
│   ├── auth/                   # Authentication module
│   │   └── auth.py             # JWT authentication
│   ├── database/
│   │   ├── connection.py       # Database connection
│   │   └── models.py           # SQLAlchemy models
│   ├── machine_learning/
│   │   └── RecommendationEngine.py  # ML algorithms
│   ├── scripts/
│   │   ├── data_loader.py      # Movie data import
│   │   ├── data_preprocessor.py # Preprocess data for recommendations
│   │   └── fetch_posters.py    # Fetch movie posters
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── app/                # Next.js app directory
    │   │   ├── movies/         # Movie pages
    │   │   ├── profile/        # User profile pages
    │   │   └── [other routes]  # Various app routes
    │   ├── components/         # React components
    │   │   ├── MovieCard.tsx   # Movie card component
    │   │   ├── RatingStars.tsx # Star rating component
    │   │   ├── MovieChatAssistant.tsx # AI chat interface
    │   │   └── [other components]
    │   ├── contexts/
    │   │   └── AuthContext.tsx # Authentication context
    │   ├── hooks/
    │   │   └── useMovies.ts    # Movie data fetching hooks
    │   ├── lib/
    │   │   └── api-client.ts   # API client
    │   └── types/
    │       └── movie.ts        # TypeScript types
    ├── public/                 # Static assets
    └── package.json
Key API Endpoints 📡
Authentication

POST /auth/register - Register new user
POST /auth/token - Login and get JWT token
GET /auth/me - Get current user profile

Movies

GET /movies/popular - Get popular movies
GET /movies/{movie_id} - Get movie details
GET /movies/all - Get all movies with pagination and sorting
POST /search - Search movies by title or genre

Recommendations

POST /movies/{movie_id}/recommendations - Get movie recommendations (hybrid, collaborative, or content-based)
POST /users/{user_id}/recommendations - Get personalized user recommendations

User Actions

POST /ratings - Add or update movie rating
GET /my-ratings - Get user's ratings
POST /watchlist - Add movie to watchlist
GET /watchlist - Get user's watchlist
DELETE /watchlist/{item_id} - Remove from watchlist
POST /watchlist/priority - Update watchlist priority

Notifications

GET /notifications - Get user notifications
POST /notifications/{id}/mark-read - Mark notification as read
POST /notifications/mark-all-read - Mark all notifications as read
DELETE /notifications/{id} - Delete a notification
DELETE /notifications - Delete all notifications

Chat

POST /chatbot/movie-details - Ask questions about a specific movie

Advanced Features 🔍
Recommendation Engine
The system uses multiple recommendation strategies:

Collaborative Filtering: Analyzes user rating patterns to find similar users
Content-Based Filtering: Recommends movies with similar attributes (genres, etc.)
Hybrid Approach: Combines both methods for optimal recommendations

AI Chat Assistant

Context-aware movie chat using LLMs (Groq or OpenAI)
Ask questions about plot, actors, ratings, etc.
The assistant has knowledge of the specific movie being viewed

User Experience

Animated transitions and hover effects
Skeleton loading states
Dynamic movie card displays
Interactive star rating component
Responsive layout for all devices

Data Handling

Efficient data loading with pagination
Client-side caching with TanStack Query
Real-time notification system
Data export capabilities for user ratings and watchlists

Development 🔧
Running Tests
bash# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test
Linting
bash# Frontend
npm run lint
Building for Production
bash# Frontend
npm run build
npm start

# Backend
uvicorn api:app --host 0.0.0.0 --port 8000
Configuration ⚙️
Environment Variables
Backend

DB_* - Database configuration
TMDB_API_KEY - For fetching movie posters and metadata
GROQ_API_KEY - For AI chat functionality
OPENAI_API_KEY - Alternative AI provider (optional)

Frontend

NEXT_PUBLIC_API_URL - Backend API URL
NEXT_PUBLIC_TMDB_IMAGE_BASE_URL - TMDB image base URL
NEXT_PUBLIC_TMDB_API_KEY - TMDB API key

Screenshots 📸
[Screenshots will be added here]
Future Enhancements 🚀

Mobile app version
Movie trailers integration
Social features - follow friends, see their ratings
Advanced analytics dashboard
Movie recommendation quiz
Integration with streaming services
PWA support for offline functionality

Acknowledgments 🙏

MovieLens for the dataset
TMDB for movie posters and metadata
shadcn/ui for UI components
FastAPI for the backend framework
Next.js for the frontend framework
Groq for AI chat capabilities
