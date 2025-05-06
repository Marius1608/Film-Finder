'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MovieCard from '@/components/MovieCard';
import { Loader2, Search, SlidersHorizontal, Film } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Movie } from '@/types/movie';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';

const extractGenres = (movies: Movie[]): string[] => {
  const genresSet = new Set<string>();
  
  movies.forEach(movie => {
    if (movie.genres) {
      movie.genres.split('|').forEach(genre => {
        genresSet.add(genre.trim());
      });
    }
  });
  
  return Array.from(genresSet).sort();
};

const MoviesPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialQuery = searchParams.get('q') || '';
  const initialGenre = searchParams.get('genre') || 'all';  
  const initialSortBy = searchParams.get('sort') || 'popularity';
  const initialPage = Number(searchParams.get('page')) || 1;
  const initialLimit = Number(searchParams.get('limit')) || 20;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialLimit);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [showFilters, setShowFilters] = useState(false);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    
    const fetchMovies = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/movies/popular`, {
          params: { limit: 500 } 
        });
        
        if (!isMounted) return;
        
        const genres = extractGenres(response.data || []);
        setAvailableGenres(genres);
        
        const allMovies = response.data || [];
        
        let filteredMovies = [...allMovies];
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredMovies = filteredMovies.filter(movie => 
            movie.title.toLowerCase().includes(query) || 
            (movie.genres && movie.genres.toLowerCase().includes(query))
          );
        }
        
        if (selectedGenre && selectedGenre !== 'all') {
          filteredMovies = filteredMovies.filter(movie => 
            movie.genres && movie.genres.includes(selectedGenre)
          );
        }
        
        if (sortBy) {
          filteredMovies.sort((a, b) => {
            switch (sortBy) {
              case 'title':
                return a.title.localeCompare(b.title);
              case 'year':
                return (b.year || 0) - (a.year || 0);
              case 'rating':
                return (b.average_rating || 0) - (a.average_rating || 0);
              case 'popularity':
              default:
                return (b.rating_count || 0) - (a.rating_count || 0);
            }
          });
        }
        
        const startIndex = (page - 1) * pageSize;
        const paginatedMovies = filteredMovies.slice(startIndex, startIndex + pageSize);
        
        setMovies(paginatedMovies);
        setIsLoading(false);
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching movies:', err);
          
          if (searchQuery) {
            try {
              const searchResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/search`, { 
                query: searchQuery,
                limit: pageSize
              });
              
              if (searchResponse.data && searchResponse.data.length > 0) {
                setMovies(searchResponse.data);
                setIsLoading(false);
                return;
              }
            } catch (searchErr) {
              console.error('Error with search fallback:', searchErr);
            }
          }
          
          setError('An error occurred while fetching movies. Please try again later.');
          setIsLoading(false);
          
          setMovies([]);
        }
      }
    };
    
    fetchMovies();
    
    return () => {
      isMounted = false;
    };
  }, [page, pageSize, sortBy, searchQuery, selectedGenre]);

  const applyFilters = () => {
    
    setPage(1);
    
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedGenre) params.set('genre', selectedGenre);
    if (sortBy !== 'popularity') params.set('sort', sortBy);
    if (page !== 1) params.set('page', page.toString());
    if (pageSize !== 20) params.set('limit', pageSize.toString());
    
    const newUrl = `/movies?${params.toString()}`;
    router.push(newUrl);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('all');  
    setSortBy('popularity');
    setPage(1);
    router.push('/movies');
  };

  const hasActiveFilters = selectedGenre || searchQuery || sortBy !== 'popularity';
  //const totalPages = Math.ceil(movies.length / pageSize) || 1;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Film className="w-8 h-8" />
          Movies
        </h1>
        <p className="text-gray-600">Discover and explore our movie collection</p>
      </div>

      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex w-full md:w-auto gap-2">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search movies..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>
            <Button type="button" onClick={applyFilters}>Search</Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="year">Release Year</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Show" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
                <SelectItem value="500">500</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {showFilters && (
          <Card className="w-full">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Genre</label>
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genres</SelectItem>
                      {availableGenres.map((genre) => (
                        genre && <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end gap-2 col-span-1 md:col-span-1">
                  <Button className="flex-1" onClick={applyFilters}>
                    Apply Filters
                  </Button>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-sm font-medium">Active Filters:</span>
            {selectedGenre && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Genre: {selectedGenre}
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {searchQuery}
              </Badge>
            )}
            {sortBy !== 'popularity' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Sort: {sortBy}
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 py-0 px-2">
              Clear All
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      ) : movies && movies.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {movies.map((movie) => (
              <MovieCard
                key={movie.movie_id}
                movie={movie}
                onSelect={(movie) => {
                  window.location.href = `/movies/${movie.movie_id}`;
                }}
              />
            ))}
          </div>
          
          <div className="mt-8 flex justify-center">
            <div className="flex gap-2">
             
              {/* <Button
                variant="outline"
                onClick={() => {
                  const newPage = Math.max(1, page - 1);
                  setPage(newPage);
                  
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('page', newPage.toString());
                  router.push(`/movies?${params.toString()}`);
                }}
                disabled={page === 1}
              >
                Previous
              </Button>
              
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                onClick={() => {
                  const newPage = page + 1;
                  setPage(newPage);
                  
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('page', newPage.toString());
                  router.push(`/movies?${params.toString()}`);
                }}
                disabled={page >= totalPages}
              >
                Next
              </Button>
               */}

            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No movies found matching your criteria</p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default MoviesPage;