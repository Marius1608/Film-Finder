'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ArrowLeft, Star, Activity, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import axios from 'axios';
import { cn } from '@/lib/utils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface RatingItem {
  rating: number;
  count: number;
  name: string;
}

interface GenreStat {
  average: number;
  count: number;
}

interface WatchStats {
  average_rating: number;
  total_movies_rated: number;
  highest_rated_genre: string;
  genre_stats: {
    [genre: string]: GenreStat;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
  }>;
  label?: string;
}

export default function RatingAnalyticsPage() {
  const router = useRouter();
  const [ratingData, setRatingData] = useState<RatingItem[]>([]);
  const [watchStats, setWatchStats] = useState<WatchStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('distribution');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ratingResponse, statsResponse] = await Promise.all([
        axios.get<RatingItem[]>('/analytics/rating-distribution'),
        axios.get<WatchStats>('/analytics/watch-statistics')
      ]);
      
      const formattedRatingData = ratingResponse.data.map((item: RatingItem) => ({
        ...item,
        name: `${item.rating} ⭐`
      }));
      
      setRatingData(formattedRatingData);
      setWatchStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPieData = () => {
    if (!watchStats || !watchStats.genre_stats) return [];
    
    return Object.entries(watchStats.genre_stats).map(([genre, stats]) => ({
      name: genre,
      value: stats.count
    })).sort((a, b) => b.value - a.value).slice(0, 6);
  };
  
  const getGenreRatingData = () => {
    if (!watchStats || !watchStats.genre_stats) return [];
    
    return Object.entries(watchStats.genre_stats)
      .map(([genre, stats]) => ({
        name: genre,
        avgRating: stats.average,
        count: stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm">{`Count: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  const renderActiveTab = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-b-2 border-primary/30"></div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'distribution':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Rating Distribution
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ratingData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="count" 
                      name="Number of Movies" 
                      fill="#8884d8"
                      animationDuration={1500}
                      radius={[4, 4, 0, 0]}
                    >
                      {ratingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Average Rating</p>
                      <p className="text-3xl font-bold text-gray-900 flex items-center">
                        {watchStats?.average_rating || 0}
                        <Star className="w-6 h-6 text-yellow-500 ml-1" />
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Activity className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Movies Rated</p>
                      <p className="text-3xl font-bold text-gray-900">{watchStats?.total_movies_rated || 0}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Favorite Genre</p>
                      <p className="text-xl font-bold text-gray-900">{watchStats?.highest_rated_genre || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Award className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
          
      case 'genres':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold mb-3">Genre Distribution</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPieData()}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        animationDuration={1500}
                      >
                        {getPieData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold mb-3">Genre Average Ratings</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getGenreRatingData()}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 5]} />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip />
                      <Bar 
                        dataKey="avgRating" 
                        name="Average Rating" 
                        fill="#82ca9d"
                        animationDuration={1500}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold mb-3">Top Genres by Movie Count</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getGenreRatingData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="count" 
                      name="Movies Watched" 
                      fill="#0088FE"
                      animationDuration={1500}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
          
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        onClick={() => router.back()}
        variant="ghost"
        className="mb-4 hover:bg-primary/10 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Movie Rating Analytics
          </CardTitle>
        </CardHeader>
        
        <div className="border-b px-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('distribution')}
              className={cn(
                "py-3 border-b-2 font-medium transition-colors flex items-center gap-2",
                activeTab === 'distribution' 
                  ? "border-primary text-primary" 
                  : "border-transparent hover:border-gray-200"
              )}
            >
              <BarChart3 className="w-4 h-4" />
              Rating Distribution
            </button>
            <button
              onClick={() => setActiveTab('genres')}
              className={cn(
                "py-3 border-b-2 font-medium transition-colors flex items-center gap-2",
                activeTab === 'genres' 
                  ? "border-primary text-primary" 
                  : "border-transparent hover:border-gray-200"
              )}
            >
              <Activity className="w-4 h-4" />
              Genre Analytics
            </button>
          </div>
        </div>
        
        <CardContent className="p-6">
          {renderActiveTab()}
        </CardContent>
      </Card>
    </div>
  );
}