'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Film, Star, Clock, Calendar, User as UserIcon, 
  LogOut, Award, TrendingUp, ChevronRight,
  BarChart3, Settings, Edit2,
  X
} from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import RatingStars from '@/components/RatingStars';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface UserRating {
  movie_id: number;
  movie_title: string;
  year: number;
  rating: number;
  review?: string;
  timestamp: string;
  poster_path?: string;
}

interface UserStats {
  rating_count: number;
  average_rating: number;
  watchlist_count: number;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [userRatings, setUserRatings] = useState<UserRating[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setActiveTab] = useState('stats');
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const ratingsResponse = await axios.get('/my-ratings');
        setUserRatings(ratingsResponse.data);

        const statsResponse = await axios.get('/user/statistics');
        setStats(statsResponse.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, router]);

  const handleImageError = (movieId: number) => {
    setImageLoadErrors(prev => new Set(prev).add(movieId));
  };

  if (!user) {
    return null;
  }

  const memberDuration = user.created_at
    ? Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <UserIcon className="w-8 h-8 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Your Profile
            </span>
          </h1>
          <p className="text-gray-600 text-lg">View and manage your profile information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 border-0 shadow-xl animate-slide-in">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
              <CardTitle className="text-center">User Information</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-6">
              <div className="relative group">
                <Avatar className="w-32 h-32 mb-4 border-4 border-primary/20 shadow-xl transition-transform group-hover:scale-105">
                  <AvatarImage src="/avatars/01.png" alt={user.email} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-secondary text-white">
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-lg"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              
              <h2 className="text-2xl font-bold mb-2 text-center">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-gray-500 mb-6 text-center">{user.email}</p>
              
              <div className="w-full space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Member since
                    </span>
                    <span className="font-medium">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    {memberDuration} days ago
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Last login
                    </span>
                    <span className="font-medium">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="w-full space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-center hover:border-primary transition-colors"
                  onClick={() => router.push('/settings')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-center hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 animate-slide-in-delayed">
            <Tabs defaultValue="stats" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Statistics
                </TabsTrigger>
                <TabsTrigger value="ratings" className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Your Ratings
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="stats" className="animate-fade-in">
                <Card className="border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Your Activity Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-b-2 border-primary/30"></div>
                        </div>
                      </div>
                    ) : stats ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all animate-scale-in">
                          <div className="flex flex-col items-center">
                            <div className="p-3 bg-yellow-400/20 rounded-full mb-3">
                              <Star className="w-10 h-10 text-yellow-600" />
                            </div>
                            <p className="text-4xl font-bold text-yellow-700">{stats.rating_count}</p>
                            <p className="text-gray-700 font-medium">Movies Rated</p>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all animate-scale-in" style={{ animationDelay: '100ms' }}>
                          <div className="flex flex-col items-center">
                            <div className="p-3 bg-blue-400/20 rounded-full mb-3">
                              <Film className="w-10 h-10 text-blue-600" />
                            </div>
                            <p className="text-4xl font-bold text-blue-700">{stats.watchlist_count}</p>
                            <p className="text-gray-700 font-medium">Watchlist Movies</p>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all animate-scale-in" style={{ animationDelay: '200ms' }}>
                          <div className="flex flex-col items-center">
                            <div className="p-3 bg-purple-400/20 rounded-full mb-3">
                              <TrendingUp className="w-10 h-10 text-purple-600" />
                            </div>
                            <p className="text-4xl font-bold text-purple-700">
                              {stats.average_rating ? stats.average_rating.toFixed(1) : 'N/A'}
                            </p>
                            <p className="text-gray-700 font-medium">Average Rating</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No statistics available yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="ratings" className="animate-fade-in">
                <Card className="border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-primary" />
                      Movies You&apos;ve Rated
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-b-2 border-primary/30"></div>
                        </div>
                      </div>
                    ) : userRatings.length > 0 ? (
                      <div className="space-y-4">
                        {userRatings.map((rating, index) => (
                          <div 
                            key={rating.movie_id} 
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-xl border-2 border-transparent",
                              "hover:border-primary/20 hover:bg-primary/5 hover:shadow-lg",
                              "transition-all cursor-pointer group animate-slide-in"
                            )}
                            style={{ animationDelay: `${index * 50}ms` }}
                            onClick={() => router.push(`/movies/${rating.movie_id}`)}
                          >
                            <div className="flex-shrink-0 h-20 w-14 relative bg-gray-200 rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow">
                              {rating.poster_path && !imageLoadErrors.has(rating.movie_id) ? (
                                <Image
                                  src={`https://image.tmdb.org/t/p/w92${rating.poster_path}`}
                                  alt={rating.movie_title}
                                  fill
                                  sizes="56px"
                                  className="object-cover"
                                  onError={() => handleImageError(rating.movie_id)}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                                  <Film className="w-6 h-6 text-gray-500" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                                {rating.movie_title}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {rating.year}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(rating.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <RatingStars 
                                rating={rating.rating} 
                                readonly={true}
                                size="sm"
                                showValue={true}
                              />
                              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="relative inline-block mb-6">
                          <Star className="w-16 h-16 text-gray-300" />
                          <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1">
                            <X className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <p className="text-gray-500 mb-6 text-lg">You haven&apos;t rated any movies yet</p>
                        <Button 
                          onClick={() => router.push('/movies')}
                          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                        >
                          <Film className="w-4 h-4 mr-2" />
                          Discover Movies to Rate
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}