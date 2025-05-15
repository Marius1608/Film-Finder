'use client';

import { useState } from 'react';
import MovieCard from '@/components/MovieCard';
import { 
 Sparkles, TrendingUp, Brain, Users, 
  RefreshCw,Wand2, Trophy, Target
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import type { MovieRecommendation } from '@/types/movie';
import { cn } from '@/lib/utils';

const methodDetails = {
  hybrid: {
    icon: <Wand2 className="w-5 h-5" />,
    description: 'Combines multiple recommendation approaches for best results',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500'
  },
  collaborative: {
    icon: <Users className="w-5 h-5" />,
    description: 'Based on similar users preferences',
    color: 'bg-gradient-to-r from-blue-500 to-cyan-500'
  },
  personalized: {
    icon: <Brain className="w-5 h-5" />,
    description: 'Tailored specifically to your unique taste',
    color: 'bg-gradient-to-r from-green-500 to-emerald-500'
  }
};

export default function RecommendationsPage() {
  const { user } = useAuth();
  const [method, setMethod] = useState('hybrid');
  const [limit, setLimit] = useState(20);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: recommendations, isLoading, error, refetch } = useQuery<MovieRecommendation[]>({
    queryKey: ['recommendations', user?.id, method, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      
      if (method === 'personalized') {
        const { data } = await axios.post(`/users/${user.id}/recommendations`, { limit });
        return data;
      } else {
        const ratingsResponse = await axios.get('/my-ratings');
        const userRatings = ratingsResponse.data;
        
        if (userRatings.length > 0) {
          type UserRating = { movie_id: number; rating: number };
          const highlyRatedMovie = (userRatings as UserRating[]).sort((a, b) => b.rating - a.rating)[0];
          const { data } = await axios.post(`/movies/${highlyRatedMovie.movie_id}/recommendations`, {
            method,
            limit
          });
          return data;
        } else {
          const popularResponse = await axios.get('/movies/popular?limit=1');
          const popularMovie = popularResponse.data[0];
          if (popularMovie) {
            const { data } = await axios.post(`/movies/${popularMovie.movie_id}/recommendations`, {
              method,
              limit
            });
            return data;
          }
        }
      }
      return [];
    },
    enabled: !!user,
  });

  const uniqueRecommendations = recommendations ? 
    Array.from(new Map(recommendations.map(movie => [movie.movie_id, movie])).values()) 
    : [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <Card className="max-w-md w-full shadow-xl border-0 animate-scale-in">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="p-4 bg-primary/10 rounded-full inline-block mb-4">
              <Sparkles className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Login Required</h3>
            <p className="text-gray-500 mb-4">Please login to see personalized recommendations</p>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              Login Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="relative">
          <Sparkles className="w-16 h-16 text-primary animate-pulse" />
          <div className="absolute inset-0 animate-ping">
            <Sparkles className="w-16 h-16 text-primary/30" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full shadow-xl border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="p-4 bg-red-100 rounded-full inline-block mb-4">
              <X className="h-12 w-12 text-red-500" />
            </div>
            <p className="text-red-500 text-xl mb-4">Error loading recommendations</p>
            <Button 
              onClick={() => refetch()}
              variant="outline"
              className="hover:border-primary"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl shadow-lg">
              <Sparkles className="w-10 h-10 text-white animate-pulse" />
            </div>
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Your Recommendations
            </span>
          </h1>
          <p className="text-gray-600 text-lg">Movies tailored specially for your unique taste</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {Object.entries(methodDetails).map(([key, details], index) => (
            <Card 
              key={key}
              className={cn(
                "cursor-pointer border-2 transition-all duration-300 animate-scale-in hover:shadow-lg",
                method === key ? "border-primary shadow-lg" : "border-transparent hover:border-gray-300"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setMethod(key)}
            >
              <CardContent className="p-4">
                <div className={cn(
                  "flex items-center gap-3 mb-2",
                  method === key && "text-primary"
                )}>
                  <div className={cn(
                    "p-2 rounded-lg text-white",
                    details.color
                  )}>
                    {details.icon}
                  </div>
                  <h3 className="font-semibold capitalize">
                    {key.replace('_', ' ')}
                  </h3>
                </div>
                <p className="text-sm text-gray-600">{details.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-8 shadow-lg border-0 animate-slide-up">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <span className="font-medium">Recommendation Settings</span>
              </div>
              
              <div className="flex flex-wrap gap-4 items-center">
                <Select value={limit.toString()} onValueChange={(v) => setLimit(Number(v))}>
                  <SelectTrigger className="w-[150px] border-2 hover:border-primary transition-colors">
                    <SelectValue placeholder="Number of results" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Show 10</SelectItem>
                    <SelectItem value="20">Show 20</SelectItem>
                    <SelectItem value="30">Show 30</SelectItem>
                    <SelectItem value="50">Show 50</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  disabled={isRefreshing}
                  className="hover:border-primary transition-colors"
                >
                  <RefreshCw className={cn(
                    "w-4 h-4 mr-2",
                    isRefreshing && "animate-spin"
                  )} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {uniqueRecommendations.length > 0 && (
          <div className="mb-6 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                {uniqueRecommendations.length} recommendations found
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Using {method} algorithm
              </span>
            </div>
          </div>
        )}

        {uniqueRecommendations && uniqueRecommendations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {uniqueRecommendations.map((movie, index) => (
              <div 
                key={`${movie.movie_id}-${index}`} 
                className="relative animate-scale-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <MovieCard
                  movie={movie}
                  onSelect={(movie) => {
                    window.location.href = `/movies/${movie.movie_id}`;
                  }}
                  index={index}
                />
                
                {movie.similarity_score && (
                  <div className={cn(
                    "absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold shadow-lg",
                    "bg-gradient-to-r text-white animate-pulse",
                    movie.similarity_score >= 0.8 
                      ? "from-green-500 to-emerald-500" 
                      : movie.similarity_score >= 0.6 
                        ? "from-yellow-500 to-orange-500"
                        : "from-blue-500 to-cyan-500"
                  )}>
                    {(movie.similarity_score * 100).toFixed(0)}% match
                  </div>
                )}
                
                {movie.method && (
                  <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-medium shadow-lg">
                    {movie.method.replace('_', ' ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Card className="shadow-xl border-0">
            <CardContent className="py-12 text-center">
              <div className="relative inline-block mb-6">
                <Film className="w-20 h-20 text-gray-300" />
                <div className="absolute bottom-0 right-0 bg-yellow-500 rounded-full p-1">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Recommendations Yet</h3>
              <p className="text-gray-500 mb-6">
                Start rating movies to get personalized recommendations!
              </p>
              <Button 
                onClick={() => window.location.href = '/movies'}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Film className="w-4 h-4 mr-2" />
                Browse Movies
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

import { X, Film } from 'lucide-react';