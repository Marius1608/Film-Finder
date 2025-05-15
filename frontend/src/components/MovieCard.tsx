import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Star, Calendar, Film, Eye, Play } from 'lucide-react';
import Image from 'next/image';
import type { Movie } from '@/types/movie';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MovieCardProps {
  movie: Movie;
  onSelect?: (movie: Movie) => void;
  index?: number;
}

const MovieCard = ({ movie, onSelect, index = 0 }: MovieCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const posterPath = movie.poster_path;
  const hasPosterPath = posterPath && posterPath !== 'null' && posterPath !== 'None' && posterPath.length > 0;
  
  const imageUrl = hasPosterPath 
    ? (posterPath.startsWith('http') 
        ? posterPath 
        : `https://image.tmdb.org/t/p/w500${posterPath.startsWith('/') ? posterPath : `/${posterPath}`}`)
    : null;

  const generateColorFromTitle = (title: string) => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 80%)`;
  };

  const fallbackBgColor = generateColorFromTitle(movie.title);

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-500';
    if (rating >= 6) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-500 h-full flex flex-col group relative overflow-hidden",
        "hover:shadow-2xl hover:scale-105 hover:z-10",
        "animate-scale-fade-in"
      )}
      onClick={() => onSelect?.(movie)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animationDelay: `${index * 100}ms`
      }}
    >
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent",
        "z-20 flex items-end p-4 transition-opacity duration-300",
        isHovered ? "opacity-100" : "opacity-0"
      )}>
        <div className="transform transition-transform duration-300 translate-y-4 group-hover:translate-y-0">
          <p className="text-white text-sm line-clamp-3 mb-3">
            {movie.overview || 'No overview available'}
          </p>
          <div className="flex gap-2">
            <button className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs flex items-center gap-1 hover:bg-white/30 transition-colors">
              <Play className="w-3 h-3" />
              Watch
            </button>
          </div>
        </div>
      </div>

      <CardContent className="p-0 flex-grow relative">
        <div className="relative aspect-[2/3] w-full overflow-hidden">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer" />
          )}
          
          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={movie.title}
              fill
              className={cn(
                "object-cover transition-all duration-300",
                imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
                isHovered && "scale-110"
              )}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
            />
          ) : (
            <div 
              className={cn(
                "w-full h-full flex items-center justify-center transition-all duration-300",
                "bg-gradient-to-br"
              )}
              style={{ 
                backgroundColor: fallbackBgColor,
                backgroundImage: `linear-gradient(135deg, ${fallbackBgColor}22 0%, ${fallbackBgColor}66 100%)`
              }}
            >
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <Film className={cn(
                  "w-16 h-16 text-gray-700 mb-3 transition-transform duration-300",
                  isHovered && "scale-110 rotate-12"
                )} />
                <span className="font-semibold text-sm text-gray-700 line-clamp-2">
                  {movie.title}
                </span>
              </div>
            </div>
          )}

          {movie.average_rating && (
            <div className={cn(
              "absolute top-2 right-2 bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1",
              "flex items-center gap-1 transition-all duration-300",
              "transform translate-x-0 group-hover:translate-x-0",
              !isHovered && "translate-x-20"
            )}>
              <Star className={cn("w-3 h-3 fill-current", getRatingColor(movie.average_rating))} />
              <span className={cn("text-xs font-bold", getRatingColor(movie.average_rating))}>
                {movie.average_rating.toFixed(1)}
              </span>
            </div>
          )}
          
          {movie.rating_count && (
            <div className={cn(
              "absolute top-2 left-2 bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1",
              "flex items-center gap-1 transition-all duration-300",
              "transform translate-x-0 group-hover:translate-x-0",
              !isHovered && "-translate-x-20"
            )}>
              <Eye className="w-3 h-3 text-white" />
              <span className="text-xs text-white font-medium">
                {movie.rating_count > 1000 ? `${(movie.rating_count / 1000).toFixed(1)}k` : movie.rating_count}
              </span>
            </div>
          )}
        </div>
        
        <div className="p-4 relative">
          <h3 className="font-bold text-gray-900 text-lg truncate mb-1 group-hover:text-primary transition-colors" 
              title={movie.title}>
            {movie.title}
          </h3>
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 text-gray-600">
              <Calendar className="w-3 h-3" />
              <span className="text-xs font-medium">{movie.year || 'N/A'}</span>
            </div>
            
            {movie.average_rating && (
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i}
                      className={cn(
                        "w-3 h-3 transition-colors",
                        i < Math.floor((movie.average_rating ?? 0) / 2) 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {movie.genres && (
            <div className="flex flex-wrap gap-1">
              {movie.genres.split('|').slice(0, 3).map((genre, idx) => (
                <span 
                  key={idx}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full transition-all duration-300",
                    "bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary"
                  )}
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      
      {movie.rating_count && (
        <CardFooter className={cn(
          "pt-0 pb-3 px-4 transition-all duration-300",
          "text-gray-500 group-hover:text-gray-700"
        )}>
          <p className="text-xs flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {movie.rating_count} {movie.rating_count === 1 ? 'view' : 'views'}
          </p>
        </CardFooter>
      )}
    </Card>
  );
};

export default MovieCard;