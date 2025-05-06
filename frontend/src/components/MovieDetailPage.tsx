'use client';

import { useMovie, useRecommendations } from '@/hooks/useMovies';
import { Button } from '@/components/ui/button';
import { Star, Calendar, Heart, Plus, BookmarkIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import MovieCard from '@/components/MovieCard';
import RatingStars from '@/components/RatingStars';
import { MovieChatAssistant } from '@/components/MovieChatAssistant';
import { useAuth } from '@/contexts/AuthContext';

interface MovieDetailPageProps {
  movieId: number;
}

export default function MovieDetailPage({ movieId }: MovieDetailPageProps) {
  const { user } = useAuth();
  const { data: movie, isLoading, error } = useMovie(movieId);
  const { data: recommendations } = useRecommendations(movieId);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading movie details</p>
      </div>
    );
  }

  const imageUrl = movie.poster_path 
    ? `${process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL}${movie.poster_path}`
    : '/placeholder-movie.jpg';

  const handleRating = async (rating: number) => {
    // Implementează logica pentru rating
    setUserRating(rating);
  };

  const handleWatchlistToggle = async () => {
    // Implementează logica pentru watchlist
    setIsInWatchlist(!isInWatchlist);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Movie details header */}
      <div className="grid md:grid-cols-[300px_1fr] gap-8 mb-12">
        <div className="relative aspect-[2/3] w-full max-w-[300px] mx-auto md:mx-0">
          <Image
            src={imageUrl}
            alt={movie.title}
            fill
            className="object-cover rounded-lg shadow-lg"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        </div>
        
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{movie.title}</h1>
          
          <div className="flex items-center gap-4 mb-4">
            {movie.year && (
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-1" />
                {movie.year}
              </div>
            )}
            {movie.average_rating && (
              <div className="flex items-center">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="font-semibold">{movie.average_rating.toFixed(1)}</span>
                <span className="text-gray-500 ml-1">({movie.rating_count} ratings)</span>
              </div>
            )}
          </div>

          {movie.genres && (
            <div className="flex flex-wrap gap-2 mb-6">
              {movie.genres.split('|').map((genre, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            {user && (
              <Button 
                onClick={handleWatchlistToggle}
                variant={isInWatchlist ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                {isInWatchlist ? <BookmarkIcon className="fill-current" /> : <Plus />}
                {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </Button>
            )}
            <Button variant="outline" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Add to Favorites
            </Button>
          </div>

          {/* User Rating */}
          {user && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Rate this movie:</h3>
              <RatingStars 
                rating={userRating || 0} 
                onRatingChange={handleRating}
              />
            </div>
          )}

          {/* Overview */}
          {movie.overview && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Overview</h2>
              <p className="text-gray-700">{movie.overview}</p>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations Section */}
      {recommendations && recommendations.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Recommended for You</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {recommendations.slice(0, 5).map((movie) => (
              <MovieCard
                key={movie.movie_id}
                movie={movie}
                onSelect={(movie) => {
                  window.location.href = `/movies/${movie.movie_id}`;
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Similar Movies Section */}
      {recommendations && recommendations.length > 5 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Similar Movies</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {recommendations.slice(5, 10).map((movie) => (
              <MovieCard
                key={movie.movie_id}
                movie={movie}
                onSelect={(movie) => {
                  window.location.href = `/movies/${movie.movie_id}`;
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Movie Chat Assistant */}
      <MovieChatAssistant movieId={movieId} />
    </main>
  );
}