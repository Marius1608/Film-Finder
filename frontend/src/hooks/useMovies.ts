import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { movieApi } from '@/lib/api-client';
import type { Movie, MovieRecommendation } from '@/types/movie';
import axios from 'axios';

export const useMovie = (movieId: number) => {
  return useQuery<Movie>({
    queryKey: ['movie', movieId],
    queryFn: () => movieApi.getMovie(movieId),
    enabled: !!movieId,
  });
};

export const useRecommendations = (
  movieId: number,
  method: string = 'hybrid',
  limit: number = 10
) => {
  return useQuery<MovieRecommendation[]>({
    queryKey: ['recommendations', movieId, method, limit],
    queryFn: () => movieApi.getRecommendations(movieId, method, limit),
    enabled: !!movieId,
  });
};

export const usePersonalizedRecommendations = (userId: number, limit: number = 10) => {
  return useQuery<MovieRecommendation[]>({
    queryKey: ['personalized-recommendations', userId, limit],
    queryFn: () => movieApi.getPersonalizedRecommendations(userId, limit),
    enabled: !!userId,
  });
};

export const usePopularMovies = (limit: number = 10) => {
  return useQuery<MovieRecommendation[]>({
    queryKey: ['popular-movies', limit],
    queryFn: () => movieApi.getPopularMovies(limit),
  });
};

export const useMovieSearch = (query: string, limit: number = 10) => {
  return useQuery<Movie[]>({
    queryKey: ['search', query, limit],
    queryFn: () => movieApi.searchMovies(query, limit),
    enabled: !!query,
  });
};

export const useRateMovie = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, movieId, rating }: { 
      userId: number; 
      movieId: number; 
      rating: number 
    }) => movieApi.addRating(userId, movieId, rating),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-ratings', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['movie', variables.movieId] });
      queryClient.invalidateQueries({ queryKey: ['personalized-recommendations', variables.userId] });
    },
  });
};

export const useUserRatings = (userId: number, skip: number = 0, limit: number = 10) => {
  return useQuery({
    queryKey: ['user-ratings', userId, skip, limit],
    queryFn: () => movieApi.getUserRatings(userId, skip, limit),
    enabled: !!userId,
  });
};

export const useAddToWatchlist = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ movieId, priority = 0, notes = null }: { 
      movieId: number; 
      priority?: number; 
      notes?: string | null 
    }) => axios.post('/watchlist', { movie_id: movieId, priority, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
};

export const useGetWatchlist = () => {
  return useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const { data } = await axios.get('/watchlist');
      return data;
    },
  });
};