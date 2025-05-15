'use client';

import { useMovie, useRecommendations } from '@/hooks/useMovies';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Star, Calendar, Plus, BookmarkIcon, MessageSquare, Film, 
  ChevronLeft, Eye, Award 
} from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import MovieCard from '@/components/MovieCard';
import RatingStars from '@/components/RatingStars';
import { MovieChatAssistant } from '@/components/MovieChatAssistant';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface MovieDetailPageProps {
  movieId: number;
}

export default function MovieDetailPage({ movieId }: MovieDetailPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: movie, isLoading, error } = useMovie(movieId);
  const { data: recommendations } = useRecommendations(movieId);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullOverview, setShowFullOverview] = useState(false);

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
      await axios.post(`/ratings`, null, {
        params: {
          movie_id: movieId,
          rating: rating
        }
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
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-b-2 border-primary/30"></div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <p className="text-red-500 text-xl">Error loading movie details</p>
        <Button 
          onClick={() => router.back()} 
          className="mt-4"
          variant="outline"
        >
          Go Back
        </Button>
      </div>
    );
  }

  const hasValidPoster = movie.poster_path && movie.poster_path.length > 0 && movie.poster_path !== 'null' && movie.poster_path !== 'None';
  const posterUrl = hasValidPoster 
    ? `${process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL}${movie.poster_path}`
    : '';

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white">
      
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      
      <div className="container mx-auto px-4 pt-4">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-4 hover:scale-105 transition-transform"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Movies
        </Button>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="grid lg:grid-cols-[350px_1fr] gap-8 mb-12">
          <div className="w-full">
            <div className={cn(
              "relative aspect-[2/3] w-full max-w-[350px] mx-auto lg:mx-0 rounded-xl overflow-hidden transform transition-all duration-500",
              imageLoaded ? "scale-100 opacity-100" : "scale-95 opacity-0"
            )}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
              {imageError || !hasValidPoster ? (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                  <Film className="w-20 h-20 text-gray-400 animate-pulse" />
                </div>
              ) : (
                <Image
                  src={posterUrl}
                  alt={movie.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 350px"
                  className="object-cover"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => {
                    setImageError(true);
                    setImageLoaded(true);
                  }}
                  priority
                />
              )}
              
              {movie.average_rating && (
                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-full px-3 py-2 flex items-center gap-1 z-20 animate-slide-in">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-white font-semibold">{movie.average_rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            <Card className="mt-4 border-0 shadow-lg animate-fade-in-delayed">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <Eye className="w-5 h-5 mx-auto mb-1 text-gray-500" />
                    <p className="text-sm font-medium">{movie.rating_count || 0}</p>
                    <p className="text-xs text-gray-500">Views</p>
                  </div>
                  <div>
                    <Award className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                    <p className="text-sm font-medium">Top</p>
                    <p className="text-xs text-gray-500">Rated</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="animate-fade-in">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-gray-900 animate-slide-in">
              {movie.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 mb-6 text-gray-600 animate-fade-in-delayed">
              {movie.year && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {movie.year}
                </div>
              )}
              {movie.average_rating && (
                <div className="flex items-center">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="font-semibold text-gray-900">{movie.average_rating.toFixed(1)}</span>
                  <span className="ml-1">({movie.rating_count} ratings)</span>
                </div>
              )}
            </div>

            {movie.genres && (
              <div className="flex flex-wrap gap-2 mb-6 animate-stagger-in">
                {movie.genres.split('|').map((genre, index) => (
                  <span
                    key={index}
                    className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/20 transition-colors cursor-pointer transform hover:scale-105"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-8 animate-fade-in-delayed">
              {user && (
                <Button 
                  onClick={handleWatchlistToggle}
                  variant={isInWatchlist ? "default" : "outline"}
                  className={cn(
                    "flex items-center gap-2 transition-all duration-300 transform hover:scale-105",
                    isInWatchlist && "bg-gradient-to-r from-primary to-primary/80"
                  )}
                  disabled={isSubmitting}
                >
                  {isInWatchlist ? (
                    <>
                      <BookmarkIcon className="w-4 h-4 fill-current" />
                      In Watchlist
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add to Watchlist
                    </>
                  )}
                </Button>
              )}
              
              <Button 
                variant="secondary" 
                className="flex items-center gap-2 hover:scale-105 transition-transform"
                onClick={() => setIsChatOpen(true)}
              >
                <MessageSquare className="w-4 h-4" />
                Ask AI Assistant
              </Button>
            </div>

            {user && (
              <Card className="mb-6 border-0 shadow-lg animate-fade-in-delayed">
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-3 text-gray-700">Your Rating</h3>
                  <RatingStars 
                    rating={userRating || 0} 
                    onRatingChange={handleRating}
                    readonly={isSubmitting}
                    size="lg"
                    showValue={true}
                    animated={true}
                  />
                </CardContent>
              </Card>
            )}

            <Card className="mb-6 border-0 shadow-lg animate-fade-in-delayed">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Film className="w-5 h-5 text-primary" />
                  Overview
                </h2>
                {movie.overview ? (
                  <div>
                    <p className={cn(
                      "text-gray-700 leading-relaxed transition-all duration-300",
                      !showFullOverview && "line-clamp-3"
                    )}>
                      {movie.overview}
                    </p>
                    {movie.overview.length > 200 && (
                      <button
                        onClick={() => setShowFullOverview(!showFullOverview)}
                        className="text-primary hover:text-primary/80 text-sm font-medium mt-2 transition-colors"
                      >
                        {showFullOverview ? 'Show Less' : 'Read More'}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No overview available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {recommendations && recommendations.length > 0 && (
          <section className="animate-fade-in-delayed">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              You Might Also Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recommendations.slice(0, 5).map((movie, index) => (
                <div
                  key={movie.movie_id}
                  className="transform transition-all duration-300 hover:scale-105 hover:z-10"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <MovieCard
                    movie={movie}
                    onSelect={(movie) => {
                      window.location.href = `/movies/${movie.movie_id}`;
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {movie && (
        <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
          <MovieChatAssistant movieId={movieId} movieTitle={movie.title} />
        </Dialog>
      )}
    </main>
  );
}

import { Sparkles } from 'lucide-react';