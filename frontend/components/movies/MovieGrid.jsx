import React from 'react';
import MovieCard from './MovieCard';
import Pagination from '../common/Pagination';

const MovieGrid = ({ 
  movies, 
  loading, 
  pagination, 
  onPageChange, 
  onAddToList 
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }
  
  if (!movies || movies.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-medium mb-2">Niciun film găsit</h3>
        <p className="text-gray-400">Încearcă să modifici filtrele sau termenii de căutare.</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {movies.map((movie) => (
          <MovieCard 
            key={movie.id} 
            movie={movie} 
            onAddToList={onAddToList}
          />
        ))}
      </div>
      
      {pagination && pagination.pages > 1 && (
        <div className="mt-8">
          <Pagination 
            currentPage={pagination.page} 
            totalPages={pagination.pages} 
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default MovieGrid;