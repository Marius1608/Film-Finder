'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MovieCard from '@/components/MovieCard';
import { Loader2, Search, SlidersHorizontal, Film, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Movie } from '@/types/movie';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

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
  const [, setIsFiltersAnimating] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

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

  const hasActiveFilters = selectedGenre !== 'all' || searchQuery || sortBy !== 'popularity';

  const toggleFilters = () => {
    setIsFiltersAnimating(true);
    setShowFilters(!showFilters);
    setTimeout(() => setIsFiltersAnimating(false), 300);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 blur-3xl transform -translate-y-8"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center gap-3 animate-fade-in">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Film className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Movies Collection
            </span>
          </h1>
          <p className="text-gray-600 text-lg animate-fade-in-delayed">
            Discover and explore {movies.length > 0 ? `${movies.length}+` : 'our'} amazing movies
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex w-full md:w-auto gap-3">
            <div className={cn(
              "relative flex-1 md:w-96 transition-all duration-300",
              searchFocused && "transform scale-105"
            )}>
              <Search className={cn(
                "absolute left-3 top-3 h-5 w-5 text-muted-foreground transition-colors",
                searchFocused && "text-primary"
              )} />
              <Input
                type="search"
                placeholder="Search for movies, genres..."
                className={cn(
                  "pl-11 pr-4 h-11 border-2 transition-all duration-300",
                  searchFocused && "border-primary shadow-lg shadow-primary/20"
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
            <Button 
              type="button" 
              onClick={applyFilters}
              className="h-11 px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg"
            >
              Search
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={toggleFilters}
              className={cn(
                "h-11 border-2 hover:border-primary transition-all duration-300",
                showFilters && "bg-primary/10 border-primary"
              )}
            >
              <SlidersHorizontal className={cn(
                "w-4 h-4 mr-2 transition-transform duration-300",
                showFilters && "rotate-90"
              )} />
              Filters
            </Button>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-52 h-11 border-2 hover:border-primary/50 transition-colors">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="border-2">
                <SelectItem value="popularity">
                  <span className="flex items-center gap-2">Most Popular</span>
                </SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="year">Release Year</SelectItem>
                <SelectItem value="title">Title (A-Z)</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-32 h-11 border-2 hover:border-primary/50 transition-colors">
                <SelectValue placeholder="Show" />
              </SelectTrigger>
              <SelectContent className="border-2">
                <SelectItem value="10">Show 10</SelectItem>
                <SelectItem value="20">Show 20</SelectItem>
                <SelectItem value="50">Show 50</SelectItem>
                <SelectItem value="100">Show 100</SelectItem>
                <SelectItem value="200">Show 200</SelectItem>
                <SelectItem value="500">Show All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={cn(
          "overflow-hidden transition-all duration-300",
          showFilters ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        )}>
          <Card className="w-full border-2 shadow-xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Genre</label>
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger className="border-2 hover:border-primary/50 transition-colors">
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 border-2">
                      <SelectItem value="all">
                        <span className="font-medium">All Genres</span>
                      </SelectItem>
                      {availableGenres.map((genre) => (
                        genre && <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end gap-3 col-span-1 md:col-span-1">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
                    onClick={applyFilters}
                  >
                    Apply Filters
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="border-2 hover:border-red-500/50 hover:text-red-500 transition-colors"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-2 animate-fade-in">
            <span className="text-sm font-medium text-gray-700">Active Filters:</span>
            {selectedGenre !== 'all' && (
              <Badge 
                variant="secondary" 
                className="flex items-center gap-1 px-3 py-1 bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer group"
                onClick={() => setSelectedGenre('all')}
              >
                <span>Genre: {selectedGenre}</span>
                <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Badge>
            )}
            {searchQuery && (
              <Badge 
                variant="secondary" 
                className="flex items-center gap-1 px-3 py-1 bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer group"
                onClick={() => setSearchQuery('')}
              >
                <span>Search: &quot;{searchQuery}&quot;</span>
                <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Badge>
            )}
            {sortBy !== 'popularity' && (
              <Badge 
                variant="secondary" 
                className="flex items-center gap-1 px-3 py-1 bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer group"
                onClick={() => setSortBy('popularity')}
              >
                <span>Sort: {sortBy}</span>
                <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters} 
              className="h-6 py-0 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center min-h-[400px] space-y-4">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <div className="absolute inset-0 animate-ping">
              <Loader2 className="w-12 h-12 text-primary/30" />
            </div>
          </div>
          <p className="text-gray-500 animate-pulse">Loading amazing movies...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 inline-block">
            <p className="text-red-600 text-lg">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-red-500 hover:bg-red-600"
            >
              Try Again
            </Button>
          </div>
        </div>
      ) : movies && movies.length > 0 ? (
        <>
          <div className="mb-4">
            <p className="text-gray-600 animate-fade-in">
              Showing <span className="font-semibold text-gray-900">{movies.length}</span> movies
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-stagger-in">
            {movies.map((movie, index) => (
              <div
                key={movie.movie_id}
                className="transform transition-all duration-300 hover:scale-105 hover:z-10"
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                <MovieCard
                  movie={{
                    movie_id: movie.movie_id,
                    title: movie.title,
                    year: movie.year,
                    genres: movie.genres,
                    poster_path: movie.poster_path,
                    average_rating: movie.average_rating,
                    rating_count: movie.rating_count,
                    tmdb_id: movie.tmdb_id,
                    imdb_id: movie.imdb_id,
                    overview: movie.overview
                  }}
                  onSelect={(movie) => {
                    window.location.href = `/movies/${movie.movie_id}`;
                  }}
                />
              </div>
            ))}
          </div>
          
          <div className="mt-12 flex justify-center">
            <div className="flex gap-2">
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-16 animate-fade-in">
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-12 inline-block">
            <Film className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-xl mb-6">No movies found matching your criteria</p>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                onClick={clearFilters} 
                className="border-2 hover:border-primary"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoviesPage;