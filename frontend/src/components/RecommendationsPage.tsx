'use client';

import { usePersonalizedRecommendations } from '@/hooks/useMovies';
import MovieCard from '@/components/MovieCard';
import { Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent} from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

export default function RecommendationsPage() {
  const { user } = useAuth();
  const [method, setMethod] = useState('hybrid');
  const [limit, setLimit] = useState(20);
  
  const { data: recommendations, isLoading, error } = usePersonalizedRecommendations(
    user?.id,
    limit
  );

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Please login to see personalized recommendations</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading recommendations</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-yellow-500" />
          Your Recommendations
        </h1>
        <p className="text-gray-600">Movies tailored to your taste</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Recommendation method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hybrid">Hybrid</SelectItem>
            <SelectItem value="collaborative">Collaborative</SelectItem>
            <SelectItem value="content_based">Content-based</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={limit.toString()} onValueChange={(v) => setLimit(Number(v))}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Number of results" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">Show 10</SelectItem>
            <SelectItem value="20">Show 20</SelectItem>
            <SelectItem value="50">Show 50</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {recommendations && recommendations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {recommendations.map((movie) => (
            <div key={movie.movie_id} className="relative">
              <MovieCard
                movie={movie}
                onSelect={(movie) => {
                  window.location.href = `/movies/${movie.movie_id}`;
                }}
              />
              {movie.similarity_score && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs">
                  {(movie.similarity_score * 100).toFixed(0)}% match
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              No recommendations available. Try rating some movies first!
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}