import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Star, Calendar, Film } from 'lucide-react';
import Image from 'next/image';
import type { Movie } from '@/types/movie';

interface MovieCardProps {
  movie: Movie;
  onSelect?: (movie: Movie) => void;
}

const MovieCard = ({ movie, onSelect }: MovieCardProps) => {
  
  const tmdbId = movie.tmdb_id || null;
  const hasPosterPath = movie.poster_path && movie.poster_path !== 'null' && movie.poster_path !== 'None';
  const imageUrl = hasPosterPath 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path.startsWith('/') ? movie.poster_path : `/${movie.poster_path}`}`
    : null;
  
  const fallbackUrl = tmdbId 
    ? `https://www.themoviedb.org/t/p/w500/https://www.themoviedb.org/t/p/w500/https://media.themoviedb.org/t/p/w500/t/p/w500/film/${tmdbId}`
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

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col"
      onClick={() => onSelect?.(movie)}
    >
      <CardContent className="p-0 flex-grow">
        <div className="relative aspect-[2/3] w-full">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={movie.title}
              fill
              className="object-cover rounded-t-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                
                const parent = target.parentElement;
                if (parent) {
                  parent.style.backgroundColor = fallbackBgColor;
                  
                  const titleElement = document.createElement('div');
                  titleElement.className = 'absolute inset-0 flex items-center justify-center p-4 text-center';
                  titleElement.innerHTML = `<div class="flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-700 mb-2"><path d="M19.5 2a2.5 2.5 0 0 1 2.5 2.5v15a2.5 2.5 0 0 1-2.5 2.5h-15a2.5 2.5 0 0 1-2.5-2.5v-15a2.5 2.5 0 0 1 2.5-2.5h15Z"></path><path d="M10 7v10l5-5z"></path></svg>
                    <span class="font-semibold text-sm text-gray-700">${movie.title}</span>
                  </div>`;
                  parent.appendChild(titleElement);
                }
              }}
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center rounded-t-lg" 
              style={{ backgroundColor: fallbackBgColor }}
            >
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <Film className="w-12 h-12 text-gray-700 mb-2" />
                <span className="font-semibold text-sm text-gray-700">{movie.title}</span>
              </div>
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
            
            {movie.average_rating && (
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
        </div>
      </CardContent>
      
      {movie.rating_count && (
        <CardFooter className="pt-0 pb-4 px-4">
          <p className="text-xs text-gray-400">
            {movie.rating_count} ratings
          </p>
        </CardFooter>
      )}
    </Card>
  );
};

export default MovieCard;