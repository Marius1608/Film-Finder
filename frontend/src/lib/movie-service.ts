// src/lib/movie-service.ts
import type { Movie} from '@/types/movie';

interface MovieFilterOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  genre?: string;
  yearFrom?: number;
  yearTo?: number;
  sortBy?: string;
}

export const movieService = {
  
  getMovies: async (options: MovieFilterOptions = {}): Promise<Movie[]> => {
    const {
      page = 1,
      pageSize = 20,
      search,
      genre,
      yearFrom,
      yearTo,
      sortBy = 'popularity'
    } = options;
    
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    
    if (search) params.append('search', search);
    if (genre) params.append('genre', genre);
    if (yearFrom) params.append('year_from', yearFrom.toString());
    if (yearTo) params.append('year_to', yearTo.toString());
    if (sortBy) params.append('sort_by', sortBy);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/movies?${params.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching movies:', error);
      throw error;
    }
  },
  

  getGenres: async (): Promise<string[]> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/genres`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch genres');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching genres:', error);
      return [
        'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 
        'Documentary', 'Drama', 'Family', 'Fantasy', 'Horror',
        'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War'
      ];
    }
  }
};