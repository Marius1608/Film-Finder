'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Film, Star, Clock, Calendar, User as UserIcon } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import RatingStars from '@/components/RatingStars';
import Image from 'next/image';

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

  if (!user) {
    return null; 
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <UserIcon className="w-8 h-8" />
          Profile
        </h1>
        <p className="text-gray-600">View and manage your profile information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarImage src="/avatars/01.png" alt={user.email} />
              <AvatarFallback className="text-2xl">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <h2 className="text-xl font-semibold mb-1">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-gray-500 mb-4">{user.email}</p>
            
            <div className="w-full space-y-4 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Member since:</span>
                <span className="font-medium">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Last login:</span>
                <span className="font-medium">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="mt-6 w-full" 
              onClick={logout}
            >
              Log out
            </Button>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <Tabs defaultValue="stats">
            <TabsList className="mb-4">
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="ratings">Your Ratings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stats">
              <Card>
                <CardHeader>
                  <CardTitle>Your Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                    </div>
                  ) : stats ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <Star className="w-10 h-10 mx-auto mb-2 text-yellow-500" />
                        <p className="text-3xl font-bold">{stats.rating_count}</p>
                        <p className="text-gray-600">Movies Rated</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <Film className="w-10 h-10 mx-auto mb-2 text-blue-500" />
                        <p className="text-3xl font-bold">{stats.watchlist_count}</p>
                        <p className="text-gray-600">Watchlist Movies</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <Star className="w-10 h-10 mx-auto mb-2 text-purple-500" />
                        <p className="text-3xl font-bold">
                          {stats.average_rating ? stats.average_rating.toFixed(1) : 'N/A'}
                        </p>
                        <p className="text-gray-600">Average Rating</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">No statistics available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="ratings">
              <Card>
                <CardHeader>
                  <CardTitle>Movies You have Rated</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                    </div>
                  ) : userRatings.length > 0 ? (
                    <div className="space-y-4">
                      {userRatings.map((rating) => (
                        <div 
                          key={rating.movie_id} 
                          className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/movies/${rating.movie_id}`)}
                        >
                          <div className="flex-shrink-0 h-16 w-12 relative bg-gray-200 rounded overflow-hidden">
                            {rating.poster_path ? (
                              <Image
                                src={`https://image.tmdb.org/t/p/w92${rating.poster_path}`}
                                alt={rating.movie_title}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <Film className="w-6 h-6 absolute inset-0 m-auto text-gray-400" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm md:text-base truncate">
                              {rating.movie_title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>{rating.year}</span>
                              <Clock className="w-3 h-3 ml-2" />
                              <span>{new Date(rating.timestamp).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex-shrink-0">
                            <RatingStars 
                              rating={rating.rating} 
                              readonly={true}
                              size="sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500 mb-4">You have not rated any movies yet</p>
                      <Button onClick={() => router.push('/movies')}>
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
  );
}