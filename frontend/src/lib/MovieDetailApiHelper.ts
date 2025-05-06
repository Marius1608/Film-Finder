import axios from 'axios';

interface RatingResponse {
  user_id: number;
  movie_id: number;
  rating: number | null;
  timestamp: string | null;
}

interface WatchlistResponse {
  in_watchlist: boolean;
}

export const getMovieDetails = async (movieId: number) => {
  try {
    const { data } = await axios.get(`/movies/${movieId}`);
    return data;
  } catch (error) {
    console.error('Error fetching movie details:', error);
    throw error;
  }
};


export const getUserRating = async (userId: number, movieId: number): Promise<RatingResponse | null> => {
  if (!userId) return null;
  
  try {
    const { data } = await axios.get<RatingResponse>(`/users/${userId}/ratings/${movieId}`);
    return data;
  } catch (error) {
 
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      try {
        const { data } = await axios.get('/my-ratings');
        interface Rating {
          movie_id: number;
          rating: number | null;
          timestamp: string | null;
        }
        const movieRating = data.find((rating: Rating) => rating.movie_id === movieId);
        return movieRating || null;
      } catch (secondError) {
        console.error('Error fetching user ratings (alternative):', secondError);
        return null;
      }
    }
    
    console.error('Error fetching user rating:', error);
    return null;
  }
};


export const checkWatchlistStatus = async (movieId: number): Promise<boolean> => {
  try {
    
    const { data } = await axios.get<WatchlistResponse>(`/watchlist/check/${movieId}`);
    return data.in_watchlist;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      try {
        const { data } = await axios.get('/watchlist');
        interface WatchlistItem {
          movie_id: number;
        }
        return data.some((item: WatchlistItem) => item.movie_id === movieId);
      } catch (secondError) {
        console.error('Error fetching watchlist (alternative):', secondError);
        return false;
      }
    }
    
    console.error('Error checking watchlist status:', error);
    return false;
  }
};


export const addToWatchlist = async (movieId: number, options: Record<string, string | number | boolean> = {}): Promise<boolean> => {
  try {
    await axios.post('/watchlist', null, {
      params: { movie_id: movieId, ...options }
    });
    return true;
  } catch (error) {
    if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 400)) {
      try {
        await axios.post('/watchlist', { 
          movie_id: movieId, 
          ...options 
        });
        return true;
      } catch (secondError) {
        console.error('Error adding to watchlist (alternative):', secondError);
        return false;
      }
    }
    
    console.error('Error adding to watchlist:', error);
    return false;
  }
};


export const removeFromWatchlist = async (movieId: number): Promise<boolean> => {
  try {
    await axios.delete('/watchlist', {
      params: { movie_id: movieId }
    });
    return true;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      try {
  
        const { data } = await axios.get('/watchlist');
        interface WatchlistItem {
          id: number;
          movie_id: number;
        }
        const item = data.find((item: WatchlistItem) => item.movie_id === movieId);
        
        if (item) {
          await axios.delete(`/watchlist/${item.id}`);
          return true;
        }
        return false;
      } catch (secondError) {
        console.error('Error removing from watchlist (alternative):', secondError);
        return false;
      }
    }
    
    console.error('Error removing from watchlist:', error);
    return false;
  }
};

export const saveRating = async (userId: number, movieId: number, rating: number): Promise<boolean> => {
  try {
    await axios.post(`/users/${userId}/ratings`, {
      movie_id: movieId,
      rating
    });
    return true;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      try {
        await axios.post('/ratings', {
          movie_id: movieId,
          rating
        });
        return true;
      } catch (secondError) {
        console.error('Error saving rating (alternative):', secondError);
        return false;
      }
    }
    
    console.error('Error saving rating:', error);
    return false;
  }
};