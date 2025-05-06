'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Star, Calendar, Film } from 'lucide-react';
import Image from 'next/image';
import type { Movie } from '@/types/movie';
import { useState } from 'react';
import RatingStars from './RatingStars';

interface MovieCardProps {
  movie: Movie;
  onSelect?: (movie: Movie) => void;
  showRating?: boolean;
  onRatingChange?: (rating: number) => void;
  userRating?: number | null;
}

const MovieCard = ({ 
  movie, 
  onSelect, 
  showRating = true,
  onRatingChange,
  userRating = null
}: MovieCardProps) => {
  const [imageError, setImageError] = useState(false);
  
  const imageUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  const handleImageError = () => {
    console.log(`Failed to load poster for: ${movie.title}`);
    setImageError(true);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col"
      onClick={() => onSelect?.(movie)}
    >
      <CardContent className="p-0 flex-1">
        <div className="relative aspect-[2/3] w-full">
          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={movie.title}
              fill
              className="object-cover rounded-t-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={handleImageError}
              unoptimized 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 rounded-t-lg p-4">
              <Film className="w-12 h-12 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500 text-center">
                {movie.title}
              </span>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-lg truncate" title={movie.title}>
            {movie.title}
          </h3>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">{movie.year || 'N/A'}</span>
            </div>
            
            {movie.average_rating && showRating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">
                  {movie.average_rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
          
          {movie.genres && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 truncate">
                {movie.genres.split('|').slice(0, 3).join(', ')}
              </p>
            </div>
          )}
          
          {onRatingChange && (
            <div className="mt-3">
              <RatingStars 
                rating={userRating || 0} 
                onRatingChange={onRatingChange}
                size="sm"
                showValue={false}
              />
            </div>
          )}
        </div>
      </CardContent>
      
      {(movie.rating_count || movie.overview) && (
        <CardFooter className="pt-0 pb-4 px-4 flex-shrink-0">
          {movie.rating_count && (
            <p className="text-xs text-gray-400">
              {movie.rating_count} ratings
            </p>
          )}
        </CardFooter>
      )}
    </Card>
  );
};


export default MovieCard;