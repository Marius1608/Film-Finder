import axios from 'axios';
import type { Movie, MovieRecommendation, Rating} from '@/types/movie';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error('API Error:', error.response.data);
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => {
    const { data } = await apiClient.post('/auth/register', userData);
    return data;
  },
  
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post('/auth/token', { email, password });
    return data;
  },
  
  getCurrentUser: async () => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },
};

export const movieApi = {
  getMovie: async (movieId: number): Promise<Movie> => {
    const { data } = await apiClient.get<Movie>(`/movies/${movieId}`);
    return data;
  },

  getRecommendations: async (
    movieId: number,
    method: string = 'hybrid',
    limit: number = 10
  ): Promise<MovieRecommendation[]> => {
    const { data } = await apiClient.post<MovieRecommendation[]>(
      `/movies/${movieId}/recommendations`,
      { method, limit }
    );
    return data;
  },

  getPersonalizedRecommendations: async (
    userId: number,
    limit: number = 10
  ): Promise<MovieRecommendation[]> => {
    const { data } = await apiClient.post<MovieRecommendation[]>(
      `/users/${userId}/recommendations`,
      { limit }
    );
    return data;
  },

  getPopularMovies: async (limit: number = 10): Promise<MovieRecommendation[]> => {
    const { data } = await apiClient.get<MovieRecommendation[]>(
      `/movies/popular?limit=${limit}`
    );
    return data;
  },

  searchMovies: async (query: string, limit: number = 10): Promise<Movie[]> => {
    const { data } = await apiClient.post<Movie[]>('/search', { query, limit });
    return data;
  },

  addRating: async (userId: number, movieId: number, rating: number): Promise<void> => {
    await apiClient.post(`/users/${userId}/ratings`, {
      movie_id: movieId,
      rating,
    });
  },

  getUserRatings: async (userId: number, skip: number = 0, limit: number = 10): Promise<Rating[]> => {
    const { data } = await apiClient.get<Rating[]>(
      `/users/${userId}/ratings?skip=${skip}&limit=${limit}`
    );
    return data;
  },

  getStats: async () => {
    const { data } = await apiClient.get('/stats');
    return data;
  },
};

export default apiClient;