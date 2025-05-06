'use client';

import { useMovie, useRecommendations } from '@/hooks/useMovies';
import { Button } from '@/components/ui/button';
import { Star, Calendar, Plus, BookmarkIcon, MessageSquare, Film } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import MovieCard from '@/components/MovieCard';
import RatingStars from '@/components/RatingStars';
import { MovieChatAssistant } from '@/components/MovieChatAssistant';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Dialog } from '@/components/ui/dialog';

interface MovieDetailPageProps {
  movieId: number;
}

export default function MovieDetailPage({ movieId }: MovieDetailPageProps) {
  const { user } = useAuth();
  const { data: movie, isLoading, error } = useMovie(movieId);
  const { data: recommendations } = useRecommendations(movieId);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && movie) {
      fetchUserRating();
      checkWatchlistStatus();
    }
  }, [user, movie]);

  const fetchUserRating = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`/my-ratings`);
      interface Rating {
        movie_id: number;
        rating: number;
      }

      const movieRating = (response.data as Rating[]).find((r) => r.movie_id === movieId);
      if (movieRating) {
        setUserRating(movieRating.rating);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const checkWatchlistStatus = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`/watchlist`);
      interface WatchlistItem {
        movie_id: number;
      }
      const isInList = (response.data as WatchlistItem[]).some((item) => item.movie_id === movieId);
      setIsInWatchlist(isInList);
    } catch (error) {
      console.error('Error checking watchlist status:', error);
    }
  };

  const handleRating = async (rating: number) => {
    if (!user) {
      toast.error('You must be logged in to rate movies');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await axios.post(`/ratings`, {
        movie_id: movieId,
        rating: rating
      });
      
      setUserRating(rating);
      toast.success('Rating saved successfully');
    } catch (error) {
      console.error('Error saving rating:', error);
      toast.error('Failed to save rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWatchlistToggle = async () => {
    if (!user) {
      toast.error('You must be logged in to use the watchlist');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (isInWatchlist) {
        const response = await axios.get(`/watchlist`);
        interface WatchlistItem {
          id: number;
          movie_id: number;
        }
        const watchlistItem = (response.data as WatchlistItem[]).find((item) => item.movie_id === movieId);
        
        if (watchlistItem) {
          await axios.delete(`/watchlist/${watchlistItem.id}`);
          setIsInWatchlist(false);
          toast.success('Removed from watchlist');
        }
      } else {
        await axios.post(`/watchlist`, null, {
          params: { movie_id: movieId }
        });
        setIsInWatchlist(true);
        toast.success('Added to watchlist');
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      toast.error('Failed to update watchlist');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const hasValidPoster = movie.poster_path && movie.poster_path.length > 0;
  const posterUrl = hasValidPoster 
    ? `${process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL}${movie.poster_path}`
    : '';

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-[300px_1fr] gap-8 mb-12">
        <div className="relative aspect-[2/3] w-full max-w-[300px] mx-auto md:mx-0 shadow-lg rounded-lg overflow-hidden bg-gray-200">
          {imageError || !hasValidPoster ? (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-20 h-20 text-gray-400" />
            </div>
          ) : (
            <Image
              src={posterUrl}
              alt={movie.title}
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-cover"
              onError={() => setImageError(true)}
              priority
            />
          )}
        </div>
        
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 break-words">{movie.title}</h1>
          
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

          <div className="flex flex-wrap gap-4 mb-6">
            {user && (
              <Button 
                onClick={handleWatchlistToggle}
                variant={isInWatchlist ? "default" : "outline"}
                className="flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isInWatchlist ? <BookmarkIcon className="fill-current" /> : <Plus />}
                {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                {isSubmitting && <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>}
              </Button>
            )}
            <Button 
              variant="secondary" 
              className="flex items-center gap-2"
              onClick={() => setIsChatOpen(true)}
            >
              <MessageSquare className="w-4 h-4" />
              Ask About This Movie
            </Button>
          </div>

          {user && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Rate this movie:</h3>
              <RatingStars 
                rating={userRating || 0} 
                onRatingChange={handleRating}
                readonly={isSubmitting}
              />
              {isSubmitting && <span className="ml-2 text-xs text-gray-500">Saving rating...</span>}
            </div>
          )}

          <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-3">Overview</h2>
            {movie.overview ? (
              <p className="text-gray-700 leading-relaxed">{movie.overview}</p>
            ) : (
              <p className="text-gray-500 italic">No overview available</p>
            )}
          </div>
        </div>
      </div>

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

      {movie && (
        <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
          <MovieChatAssistant movieId={movieId} movieTitle={movie.title} />
        </Dialog>
      )}
    </main>
  );
}