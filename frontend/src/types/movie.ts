
export interface Movie {
    movie_id: number;
    title: string;
    year?: number;
    genres?: string;
    average_rating?: number;
    rating_count?: number;
    imdb_id?: string;
    tmdb_id?: number;
    poster_path?: string;  
    overview?: string;
}
  
export interface MovieRecommendation extends Movie {
    similarity_score?: number;
    hybrid_score?: number;
    final_score?: number;
    method: 'collaborative_filtering' | 'content_based' | 'hybrid' | 'popular';
}
  
export interface Rating {
    movie_id: number;
    rating: number;
    timestamp: Date;
}
  
export interface UserProfile {
    id: number;
    email: string;
    favorite_genres?: { [key: string]: number };
    avg_rating?: number;
    rating_count?: number;
}
  
export interface ApiResponse<T> {
    data?: T;
    error?: string;
    status_code?: number;
}