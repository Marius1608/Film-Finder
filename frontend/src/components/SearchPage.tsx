'use client';

import { useSearchParams } from 'next/navigation';
import { useMovieSearch } from '@/hooks/useMovies';
import MovieCard from '@/components/MovieCard';
import { Loader2, Search } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  
  const { data: searchResults, isLoading, error } = useMovieSearch(activeQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchQuery);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search movies..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
        </div>
      </form>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-500">Error searching movies</p>
        </div>
      )}

      {!isLoading && searchResults && (
        <div>
          <h2 className="text-2xl font-semibold mb-6">
            Search results for: &quot;{activeQuery}&quot;
          </h2>
          {searchResults.length === 0 ? (
            <p className="text-center text-gray-500">No results found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {searchResults.map((movie) => (
                <MovieCard
                  key={movie.movie_id}
                  movie={movie}
                  onSelect={(movie) => {
                    window.location.href = `/movies/${movie.movie_id}`;
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}