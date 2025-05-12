// src/services/recommendations.ts
import axios from 'axios';

const DISABLE_NOTIFICATIONS = false;

const MIN_NOTIFICATION_INTERVAL_MINUTES = 30;

export interface MovieRecommendation {
  movie_id: number;
  title: string;
  year?: number;
  genres?: string;
  poster_path?: string;
  average_rating?: number;
  similarity_score?: number;
}

export const canSendNewNotification = async (): Promise<boolean> => {
  if (DISABLE_NOTIFICATIONS) return false;
  
  try {
    const response = await axios.get('/notifications');
    
    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      return true;
    }
    
    interface Notification {
      metadata?: string;
      created_at: string;
    }

    const lastRecommendationNotification = response.data.find((notification: Notification) => {
      try {
        const metadata = JSON.parse(notification.metadata || '{}');
        return metadata.type === 'daily_recommendations';
      } catch {
        return false;
      }
    });
    
    if (!lastRecommendationNotification) {
      return true;
    }
    
    const lastNotificationTime = new Date(lastRecommendationNotification.created_at).getTime();
    const currentTime = new Date().getTime();
    const minutesPassed = (currentTime - lastNotificationTime) / (1000 * 60);
    
    return minutesPassed >= MIN_NOTIFICATION_INTERVAL_MINUTES;
    
  } catch (error) {
    console.error('Error checking last notification time:', error);
    return true;
  }
};


export const getPopularMovieRecommendations = async (count: number = 3): Promise<MovieRecommendation[]> => {
  try {
    const response = await axios.get(`/movies/popular?limit=${count}`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    return [];
  }
};


export const fetchDailyRecommendations = async (count: number = 3): Promise<MovieRecommendation[]> => {
  if (DISABLE_NOTIFICATIONS) return [];
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const response = await axios.post('/users/recommendations/daily', null, {
        params: {
          seed: today,
          limit: count
        }
      });
      
      if (response.data && response.data.length > 0) {
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching personalized recommendations:', error);
    }
    
    return await getPopularMovieRecommendations(count);
    
  } catch (error) {
    console.error('Error fetching daily recommendations:', error);
    return [];
  }
};


export const createDailyRecommendationsNotification = async (
  recommendations: MovieRecommendation[]
): Promise<boolean> => {
  if (DISABLE_NOTIFICATIONS || !recommendations.length) return false;
  
  try {
  
    const moviesList = recommendations.map(movie => movie.title).join(', ');
    
    const metadata = JSON.stringify({
      type: 'daily_recommendations',
      timestamp: new Date().toISOString(),
      movies: recommendations.map(movie => ({
        id: movie.movie_id,
        title: movie.title
      }))
    });

    await axios.post('/notifications', null, {
      params: {
        title: 'Movie Recommendations',
        message: `Check out these films: ${moviesList}`,
        type: 'info',
        metadata: metadata
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error creating recommendation notification:', error);
    return false;
  }
};


export const generateTestNotification = async (): Promise<boolean> => {
  if (DISABLE_NOTIFICATIONS) return false;
  
  try {
    const canSend = await canSendNewNotification();
    if (!canSend) {
      console.log('Too soon to send another notification');
      return false;
    }
    
    const recommendations = await fetchDailyRecommendations(3);
    if (recommendations.length === 0) {
      console.error('No recommendations available');
      return false;
    }
    
    return await createDailyRecommendationsNotification(recommendations);
  } catch (error) {
    console.error('Error generating test notification:', error);
    return false;
  }
}


export const processDailyRecommendations = async (): Promise<void> => {
  if (DISABLE_NOTIFICATIONS) return; 
  
  try {

    const token = localStorage.getItem('token');
    if (!token) return;
    
    const canSend = await canSendNewNotification();
    if (!canSend) return;
    
    const recommendations = await fetchDailyRecommendations(3);
    if (recommendations.length > 0) {
      await createDailyRecommendationsNotification(recommendations);
    }
  } catch (error) {
    console.error('Error processing daily recommendations:', error);
  }
};


export const setupNotificationInterval = (intervalMinutes: number = 30): (() => void) => {
  if (DISABLE_NOTIFICATIONS) return () => {};
  
  processDailyRecommendations();
  
  const interval = setInterval(processDailyRecommendations, intervalMinutes * 60 * 1000);
  
  return () => clearInterval(interval);
};