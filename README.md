# FilmFinder 🎬

A modern movie recommendation system built with Next.js and Python FastAPI that helps users discover their next favorite film through intelligent recommendations.

## Features ✨

- **Movie Discovery**: Browse through an extensive collection of films
- **Smart Recommendations**: Get personalized movie suggestions using collaborative and content-based filtering
- **User Authentication**: Secure login and registration system
- **Watchlist Management**: Save movies to watch later
- **Movie Ratings**: Rate movies and see community ratings
- **Interactive Chat Assistant**: Ask questions about movies using AI (Groq/OpenAI)
- **Notifications**: Receive movie recommendations and updates
- **Advanced Search**: Filter movies by genre, year, and ratings
- **Profile Management**: Track your movie-watching statistics

## Tech Stack 🛠️

### Frontend
- **Next.js 15.3.1** - React framework with TypeScript
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **React Query (TanStack)** - Data fetching and caching
- **Lucide Icons** - Icon library
- **Axios** - HTTP client

### Backend
- **FastAPI** - Python web framework
- **SQLAlchemy** - ORM for database management
- **MySQL** - Primary database
- **Scikit-learn** - Machine learning for recommendations
- **Groq API** - Chat functionality
- **Passlib + JWT** - Authentication

## Installation 🚀

### Prerequisites
- Node.js (v18 or higher)
- Python (3.8+)
- MySQL
- TMDB API Key (for movie posters)

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/filmfinder.git
cd filmfinder/backend
```

2. Create a virtual environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Create a `.env` file in the backend directory:
```env
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_NAME=filmfinder_db
DB_PORT=3306

TMDB_API_KEY=your_tmdb_api_key
GROQ_API_KEY=your_groq_api_key      
```

4. Create the database:
```sql
CREATE DATABASE filmfinder_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. Run database migrations and load initial data:
```bash
python scripts/create_tables.py
python scripts/data_loader.py
python scripts/fetch_posters.py  # Optional: fetches movie posters
```

6. Start the backend server:
```bash
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd ../frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
NEXT_PUBLIC_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/w500
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure 📁

```
filmfinder/
├── backend/
│   ├── api.py              # Main FastAPI application
│   ├── auth/               # Authentication module
│   ├── database/           # Database models and connection
│   ├── machine_learning/   # Recommendation engine
│   ├── scripts/            # Data processing scripts
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── app/            # Next.js app directory
    │   ├── components/     # React components
    │   ├── contexts/       # React contexts
    │   ├── hooks/          # Custom hooks
    │   ├── lib/            # Utility functions
    │   ├── types/          # TypeScript types
    │   └── services/       # API services
    ├── public/             # Static assets
    └── package.json
```

## API Endpoints 📡

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/token` - Login
- `GET /auth/me` - Get current user

### Movies
- `GET /movies/popular` - Get popular movies
- `GET /movies/{movie_id}` - Get movie details
- `GET /movies/all` - Get all movies with pagination
- `POST /search` - Search movies

### Recommendations
- `POST /movies/{movie_id}/recommendations` - Get recommendations for a movie
- `POST /users/{user_id}/recommendations` - Get personalized recommendations

### User Actions
- `POST /ratings` - Add movie rating
- `GET /my-ratings` - Get user's ratings
- `POST /watchlist` - Add to watchlist
- `GET /watchlist` - Get user's watchlist
- `DELETE /watchlist/{item_id}` - Remove from watchlist

### Notifications
- `GET /notifications` - Get user notifications
- `POST /notifications/{id}/mark-read` - Mark notification as read

### Chat
- `POST /chatbot/movie-details` - Ask questions about movies

## Machine Learning Features 🤖

FilmFinder uses several recommendation algorithms:

1. **Collaborative Filtering**: Based on user behavior patterns
2. **Content-Based Filtering**: Based on movie attributes (genres, etc.)
3. **Hybrid Approach**: Combines both methods for better accuracy

The system analyzes:
- User ratings
- Movie genres
- Viewing patterns
- User preferences

## Development 🔧

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test
```

### Linting
```bash
# Frontend
npm run lint
```

### Building for Production
```bash
# Frontend
npm run build
npm start
```


## Configuration ⚙️

### Environment Variables

#### Backend
- `DB_*` - Database configuration
- `TMDB_API_KEY` - For fetching movie posters
- `OPENAI_API_KEY` - For chat functionality (optional)
- `GROQ_API_KEY` - Alternative AI provider (optional)

#### Frontend
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_TMDB_*` - TMDB configuration


## Acknowledgments 🙏

- [MovieLens](https://grouplens.org/datasets/movielens/) for the dataset
- [TMDB](https://www.themoviedb.org/) for movie posters and metadata
- [shadcn/ui](https://ui.shadcn.com/) for UI components
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [Next.js](https://nextjs.org/) for the frontend framework

