'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Brain, BarChart3, Download, FileText, 
  Gamepad2, Trophy,Clock, Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface WatchlistItem {
  title: string;
  year: number | null;
  genres: string | null;
  added_at: string;
  priority: number;
}

interface RatingItem {
  movie_title: string;
  year: number | null;
  rating: number;
  review: string | null;
  timestamp: string;
}

const features = [
  {
    id: 'quiz',
    title: 'Movie Quiz',
    description: 'Test your movie knowledge with quizzes based on posters and quotes',
    icon: <Gamepad2 className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500',
    comingSoon: false
  },
  {
    id: 'rating-charts',
    title: 'Rating Distribution',
    description: 'Visualize your movie ratings with beautiful charts and graphs',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-500',
    comingSoon: false
  },
  {
    id: 'export-watchlist',
    title: 'Export Watchlist',
    description: 'Download your watchlist in CSV format',
    icon: <Download className="w-6 h-6" />,
    color: 'from-orange-500 to-red-500',
    comingSoon: false
  },
  {
    id: 'export-ratings',
    title: 'Export Ratings',
    description: 'Export your rating history to CSV',
    icon: <FileText className="w-6 h-6" />,
    color: 'from-indigo-500 to-purple-500',
    comingSoon: false
  }
];

export default function FeaturesPage() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const router = useRouter();

  const handleExportWatchlist = async () => {
    setIsExporting('watchlist');
    try {
      const response = await axios.get<WatchlistItem[]>('/watchlist');
      const watchlist = response.data;
      
      const csvContent = [
        ['Title', 'Year', 'Genres', 'Added Date', 'Priority'],
        ...watchlist.map((item) => [
          item.title,
          item.year || 'N/A',
          item.genres || 'N/A',
          new Date(item.added_at).toLocaleDateString(),
          item.priority || 0
        ])
      ];
      
      const csv = csvContent.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `watchlist_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Watchlist exported successfully!');
    } catch (error) {
      console.error('Export watchlist error:', error);
      toast.error('Failed to export watchlist');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportRatings = async () => {
    setIsExporting('ratings');
    try {
      const response = await axios.get<RatingItem[]>('/my-ratings');
      const ratings = response.data;
      
      const csvContent = [
        ['Movie Title', 'Year', 'Rating', 'Review', 'Date'],
        ...ratings.map((rating) => [
          rating.movie_title,
          rating.year || 'N/A',
          rating.rating,
          rating.review || 'No review',
          new Date(rating.timestamp).toLocaleDateString()
        ])
      ];
      
      const csv = csvContent.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ratings_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Ratings exported successfully!');
    } catch (error) {
      console.error('Export ratings error:', error);
      toast.error('Failed to export ratings');
    } finally {
      setIsExporting(null);
    }
  };

const handleFeatureClick = async (featureId: string) => {
  switch (featureId) {
    case 'export-watchlist':
      await handleExportWatchlist();
      break;
    case 'export-ratings':
      await handleExportRatings();
      break;
    case 'quiz':
      setQuizLoading(true);
      router.push('/movie-quiz');
      break;
    case 'rating-charts':
      router.push('/analytics/ratings');
      break;
    default:
      toast('Feature coming soon!', { icon: '🚀' });
  }
};

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <Card className="max-w-md w-full shadow-xl border-0 animate-scale-in">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="p-4 bg-primary/10 rounded-full inline-block mb-4">
              <Brain className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Login Required</h3>
            <p className="text-gray-500 mb-4">Please login to access new features</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse bg-primary/20 rounded-full blur-xl" />
                <div className="relative p-4 bg-gradient-to-br from-primary to-primary/80 rounded-full shadow-xl">
                  <Brain className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              New Features
            </h1>
            <p className="text-gray-600 text-lg">
              Explore powerful tools and analytics for your movie journey
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={feature.id}
              className={cn(
                "relative overflow-hidden cursor-pointer transition-all duration-300",
                "hover:shadow-2xl hover:scale-105 animate-scale-in border-0",
                feature.comingSoon && "opacity-75"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => !feature.comingSoon && handleFeatureClick(feature.id)}
            >
              <div className={cn(
                "absolute inset-0 opacity-10 bg-gradient-to-br",
                feature.color
              )} />
              
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "p-3 rounded-lg text-white bg-gradient-to-r",
                    feature.color
                  )}>
                    {feature.icon}
                  </div>
                  {feature.comingSoon && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      Coming Soon
                    </span>
                  )}
                </div>
                <CardTitle className="mt-4">{feature.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="relative">
                <p className="text-gray-600 mb-4">{feature.description}</p>
                
                {(feature.id === 'export-watchlist' || feature.id === 'export-ratings') && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isExporting === feature.id.replace('export-', '')}
                    className="hover:border-primary transition-colors"
                  >
                    {isExporting === feature.id.replace('export-', '') ? (
                      <>Exporting...</>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export Now
                      </>
                    )}
                  </Button>
                )}
                
                {feature.id === 'quiz' && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={quizLoading}
                    className="hover:border-primary transition-colors"
                  >
                    {quizLoading ? (
                      <>Loading...</>
                    ) : (
                      <>
                        <Gamepad2 className="w-4 h-4 mr-2" />
                        Start Quiz
                      </>
                    )}
                  </Button>
                )}
                
                {(feature.id === 'rating-charts') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:border-primary transition-colors"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8 text-center">More Features Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg animate-fade-in">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-purple-100 rounded-full inline-block mb-4">
                  <Trophy className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Achievements</h3>
                <p className="text-gray-600 text-sm">Unlock badges and rewards for your movie activities</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg animate-fade-in" style={{ animationDelay: '100ms' }}>
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-blue-100 rounded-full inline-block mb-4">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Watch History</h3>
                <p className="text-gray-600 text-sm">Track when and where you watched movies</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg animate-fade-in" style={{ animationDelay: '200ms' }}>
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-green-100 rounded-full inline-block mb-4">
                  <Award className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Movie Awards</h3>
                <p className="text-gray-600 text-sm">See Oscar and other award nominations and wins</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}