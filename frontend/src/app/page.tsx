'use client';

import { usePopularMovies } from '@/hooks/useMovies';
import MovieCard from '@/components/MovieCard';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { data: popularMovies, isLoading, error } = usePopularMovies(20);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading movies</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to FilmFinder</h1>
        <p className="text-gray-600">Discover your next favorite movie</p>
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Popular Movies</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {popularMovies?.map((movie) => (
            <MovieCard 
              key={movie.movie_id} 
              movie={movie}
              onSelect={(movie) => {
                // Redirect to movie details page
                window.location.href = `/movies/${movie.movie_id}`;
              }}
            />
          ))}
        </div>
      </section>
    </main>
  );
}