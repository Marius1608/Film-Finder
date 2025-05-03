import React from 'react';
import Link from 'next/link';
import RatingStars from '../common/RatingStars';

const MovieCard = ({ movie, onAddToList }) => {
  return (
    <div className="bg-primary rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <Link href={`/movies/${movie.id}`}>
        <a className="block">
          <div className="relative aspect-[2/3] w-full">
            {movie.poster_path ? (
              <img 
                src={movie.poster_path} 
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
            
            {/* Overlay cu genuri */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <div className="flex flex-wrap gap-1 mb-2">
                {movie.genres_list?.split(',').slice(0, 3).map((genre, index) => (
                  <span 
                    key={index} 
                    className="inline-block text-xs bg-accent bg-opacity-80 text-white px-2 py-0.5 rounded-sm"
                  >
                    {genre.trim()}
                  </span>
                ))}
              </div>
              <div className="flex items-center">
                <RatingStars rating={movie.vote_average / 2} maxStars={5} size="sm" />
                <span className="text-white text-xs ml-1">
                  {movie.vote_average.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="text-md font-medium truncate mb-1" title={movie.title}>
              {movie.title}
            </h3>
            <p className="text-sm text-gray-400 mb-3">{movie.year}</p>
          </div>
        </a>
      </Link>
      
      {onAddToList && (
        <div className="px-4 pb-4">
          <button 
            onClick={() => onAddToList(movie.id)}
            className="w-full py-2 text-sm bg-primary-light text-white rounded hover:bg-accent transition flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adaugă în listă
          </button>
        </div>
      )}
    </div>
  );
};

export default MovieCard;