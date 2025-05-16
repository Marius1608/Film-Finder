
'use client';

import { useAuth } from '@/contexts/AuthContext';
import MovieCard from '@/components/MovieCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent} from '@/components/ui/card';
import { 
  Loader2, 
  TrendingUp, 
  Star, 
  Film, 
  Heart,
  Sparkles,
  Award,
  Zap,
  ChevronRight,
  Users,
} from 'lucide-react';
import { usePopularMovies, usePersonalizedRecommendations } from '@/hooks/useMovies';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "AI-Powered Recommendations",
    description: "Get personalized movie suggestions based on your unique taste"
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Community Ratings",
    description: "See what other movie lovers think and share your own reviews"
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: "Curated Collections",
    description: "Discover handpicked movies from various genres and themes"
  }
];

export default function HomePage() {
  const { user } = useAuth();
  const { data: popularMovies, isLoading: loadingPopular } = usePopularMovies(20);
  const { data: recommendations, isLoading: loadingRecommendations } = usePersonalizedRecommendations(
    user?.id || 0, 
    10
  );
  
  const [selectedCategory, setSelectedCategory] = useState('popular');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const getDisplayMovies = () => {
    if (selectedCategory === 'popular') {
      return popularMovies || [];
    }
    return recommendations || [];
  };

  const isLoading = selectedCategory === 'popular' ? loadingPopular : loadingRecommendations;
  const movies = getDisplayMovies();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className={cn(
        "relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10",
        "py-20 md:py-32 transition-all duration-1000",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full blur-3xl animate-float-delayed" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-8 animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse bg-primary/20 rounded-full blur-2xl" />
                <div className="relative p-5 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-2xl transform hover:scale-110 transition-transform">
                  <Film className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-slide-up">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Welcome to FilmFinder
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 animate-slide-up-delayed">
              Discover your next favorite movie with AI-powered recommendations
            </p>
            
            {!user ? (
              <div className="flex gap-4 justify-center animate-fade-in-delayed">
                <Button 
                  size="lg" 
                  asChild
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all transform hover:scale-105"
                >
                  <Link href="/register">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Get Started
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  asChild
                  className="border-2 hover:border-primary transition-all hover:shadow-lg"
                >
                  <Link href="/login">
                    Sign In
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="animate-fade-in-delayed">
                <h2 className="text-2xl font-medium text-gray-800 mb-4">
                  Welcome back, {user.first_name}! 🎬
                </h2>
                <div className="flex gap-4 justify-center">
                  <Button 
                    asChild
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                  >
                    <Link href="/recommendations">
                      <Zap className="w-4 h-4 mr-2" />
                      Your Recommendations
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="hover:border-primary">
                    <Link href="/watchlist">
                      <Heart className="w-4 h-4 mr-2" />
                      Watchlist
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {!user && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 animate-fade-in">
              Why Choose FilmFinder?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6 text-center">
                    <div className="p-3 bg-primary/10 rounded-xl inline-block mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {user && (
        <section className="py-12 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg animate-scale-in">
                <CardContent className="p-6 text-center">
                  <Film className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-bold">1000+</p>
                  <p className="text-gray-600">Movies Available</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg animate-scale-in" style={{ animationDelay: '100ms' }}>
                <CardContent className="p-6 text-center">
                  <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold">4.5+</p>
                  <p className="text-gray-600">Average Rating</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg animate-scale-in" style={{ animationDelay: '200ms' }}>
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold">10K+</p>
                  <p className="text-gray-600">Active Users</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg animate-scale-in" style={{ animationDelay: '300ms' }}>
                <CardContent className="p-6 text-center">
                  <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold">50K+</p>
                  <p className="text-gray-600">Movies Watchlisted</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {selectedCategory === 'popular' ? 'Popular Movies' : 'Recommended for You'}
              </span>
            </h2>
            <p className="text-gray-600">
              {selectedCategory === 'popular' 
                ? 'Trending movies loved by our community' 
                : 'Movies tailored to your unique taste'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setSelectedCategory('popular')}
              variant={selectedCategory === 'popular' ? 'default' : 'outline'}
              className={cn(
                "transition-all duration-300",
                selectedCategory === 'popular' 
                  ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg" 
                  : "hover:border-primary"
              )}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Popular Movies
            </Button>
            {user && (
              <Button
                onClick={() => setSelectedCategory('recommendations')}
                variant={selectedCategory === 'recommendations' ? 'default' : 'outline'}
                className={cn(
                  "transition-all duration-300",
                  selectedCategory === 'recommendations' 
                    ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg" 
                    : "hover:border-primary"
                )}
              >
                <Star className="w-4 h-4 mr-2" />
                For You
              </Button>
            )}
            <Button 
              asChild 
              variant="outline"
              className="group hover:border-primary transition-all"
            >
              <Link href="/movies">
                Explore All Movies
                <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center min-h-[400px]">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <div className="absolute inset-0 animate-ping">
                <Loader2 className="w-12 h-12 text-primary/30" />
              </div>
            </div>
            <p className="mt-4 text-gray-500 animate-pulse">Loading amazing movies...</p>
          </div>
        ) : movies && movies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-stagger-in">
            {movies.map((movie, index) => (
              <div
                key={`${movie.movie_id}-${index}`}
                className="animate-scale-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <MovieCard
                  movie={movie}
                  index={index}
                  onSelect={(movie) => {
                    window.location.href = `/movies/${movie.movie_id}`;
                  }}
                />
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
              <h3 className="text-xl font-semibold mb-2">
                {selectedCategory === 'popular' 
                  ? "No popular movies available" 
                  : "No recommendations yet"}
              </h3>
              <p className="text-gray-500 mb-6">
                {selectedCategory === 'popular' 
                  ? "Please check back later for trending movies" 
                  : "Start rating movies to get personalized recommendations!"}
              </p>
              {selectedCategory === 'recommendations' && (
                <Button asChild className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
                  <Link href="/movies">
                    <Film className="w-4 h-4 mr-2" />
                    Browse Movies
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      {!user && (
        <section className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-4 animate-fade-in">
              Ready to Discover Amazing Movies?
            </h2>
            <p className="text-xl mb-8 animate-fade-in-delayed">
              Join thousands of movie lovers finding their perfect watch
            </p>
            <div className="flex gap-4 justify-center animate-scale-in">
              <Button 
                size="lg" 
                asChild
                className="bg-white text-primary hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Link href="/register">
                  Create Your Account
                  <Sparkles className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild
                className="border-white text-white hover:bg-white/10 transition-all"
              >
                <Link href="/login">
                  Sign In Now
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}