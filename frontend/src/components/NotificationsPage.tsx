'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import { 
  Bell, Check, Film, Info, AlertTriangle, X, RefreshCw, 
  Sparkles, CheckCircle, Trash2, Clock, Calendar, ChevronDown 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface Movie {
  id: number;
  title: string;
}

interface NotificationMetadata {
  type: string;
  movies?: Movie[];
  timestamp?: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  metadata?: string;
}

const getNotificationIcon = (type: Notification['type']) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500 animate-pulse-subtle" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500 animate-bounce-subtle" />,
    error: <X className="h-5 w-5 text-red-500 animate-shake-subtle" />,
    info: <Info className="h-5 w-5 text-blue-500 animate-pulse-subtle" />
  };
  return icons[type];
};

const getNotificationColor = (type: Notification['type']) => {
  const colors = {
    success: 'border-green-200 bg-green-50/50',
    warning: 'border-yellow-200 bg-yellow-50/50',
    error: 'border-red-200 bg-red-50/50',
    info: 'border-blue-200 bg-blue-50/50'
  };
  return colors[type];
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread'>('all');
  const [expandedNotifications, setExpandedNotifications] = useState<Set<number>>(new Set());
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchNotifications();
    const refreshInterval = setInterval(fetchNotifications, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [user, router]);

  const fetchNotifications = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await axios.get('/notifications');
      
      if (response.data && Array.isArray(response.data)) {
        const sortedNotifications = [...response.data].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setNotifications(sortedNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await axios.post(`/notifications/${notificationId}/mark-read`);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      toast.success('Marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      await axios.post('/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await axios.delete(`/notifications/${notificationId}`);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const deleteAllNotifications = async () => {
    if (window.confirm('Are you sure you want to delete all notifications? This cannot be undone.')) {
      setIsLoading(true);
      try {
        await axios.delete('/notifications');
        setNotifications([]);
        toast.success('All notifications deleted');
      } catch (error) {
        console.error('Error deleting all notifications:', error);
        toast.error('Failed to delete all notifications');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCreateTestNotification = async () => {
    setIsGenerating(true);
    try {
      const response = await axios.get('/movies/popular?limit=30');
      const allMovies = response.data || [];
      
      if (allMovies.length === 0) {
        toast.error('No movies available for notification');
        return;
      }
      
      const getRandomMovies = (movies: Movie[], count: number) => {
        const shuffled = [...movies].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, shuffled.length));
      };
      
      const randomCount = Math.floor(Math.random() * 3) + 1;
      const selectedMovies = getRandomMovies(allMovies, randomCount);
      const movieTitles = selectedMovies.map((movie: Movie) => movie.title).join(', ');
      
      const notificationTitles = [
        'New Movie Recommendations',
        'Movies You Might Like',
        'Personalized Picks',
        'Discover New Films',
        'Trending Now'
      ];
      
      const randomTitle = notificationTitles[Math.floor(Math.random() * notificationTitles.length)];
      const notificationTypes = ['info', 'success', 'warning'];
      const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)] as 'info' | 'success' | 'warning';
      
      const metadata = JSON.stringify({
        type: 'daily_recommendations',
        timestamp: new Date().toISOString(),
        movies: selectedMovies.map((movie: Movie) => ({
          id: movie.id,
          title: movie.title
        }))
      });
      
      await axios.post('/notifications', null, {
        params: { 
          title: randomTitle,
          message: `Check out these movies: ${movieTitles}`,
          type: randomType,
          metadata: metadata
        }
      });
      
      toast.success('Test notification created');
      await fetchNotifications();
    } catch (error) {
      console.error('Error creating test notification:', error);
      toast.error('Failed to create test notification');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMovieClick = (movieId: number) => {
    router.push(`/movies/${movieId}`);
  };

  const toggleNotificationExpansion = (notificationId: number) => {
    const newExpanded = new Set(expandedNotifications);
    if (newExpanded.has(notificationId)) {
      newExpanded.delete(notificationId);
    } else {
      newExpanded.add(notificationId);
    }
    setExpandedNotifications(newExpanded);
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderRecommendationContent = (notification: Notification) => {
    if (!notification.metadata) return null;
    
    try {
      const metadata = JSON.parse(notification.metadata) as NotificationMetadata;
      
      if (metadata.movies) {
        return (
          <div className={cn(
            "mt-4 transition-all duration-300",
            expandedNotifications.has(notification.id) ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
          )}>
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-lg border border-primary/10">
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Film className="w-4 h-4 text-primary" />
                Recommended Movies
              </p>
              <div className="grid grid-cols-1 gap-2">
                {metadata.movies.map((movie, index) => (
                  <div 
                    key={movie.id}
                    className={cn(
                      "flex items-center p-3 rounded-lg",
                      "bg-white hover:bg-primary/5 transition-all duration-300",
                      "cursor-pointer group hover:shadow-md",
                      "animate-slide-in"
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => handleMovieClick(movie.id)}
                  >
                    <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                      <Film className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium ml-3 group-hover:text-primary transition-colors">
                      {movie.title}
                    </span>
                    <ChevronDown className="ml-auto h-4 w-4 text-gray-400 group-hover:text-primary rotate-[-90deg] transition-all" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }
    } catch (error) {
      console.error('Error rendering recommendation content:', error);
    }
    
    return null;
  };

  const filteredNotifications = selectedFilter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="py-8 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-4">Please log in to view your notifications</p>
            <Button 
              className="bg-gradient-to-r from-primary to-primary/80"
              onClick={() => router.push('/login')}
            >
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Bell className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Notifications
            </span>
          </h1>
          <p className="text-gray-600 text-lg">Stay updated with your movie recommendations</p>
        </div>

        <Card className="mb-6 shadow-lg border-0 animate-slide-up">
          <CardContent className="py-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Notification Center</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Last update: {notifications.length > 0 ? getTimeAgo(notifications[0].created_at) : 'Never'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bell className="w-4 h-4" />
                    {notifications.filter(n => !n.read).length} unread
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchNotifications}
                  disabled={isLoading}
                  className="hover:border-primary transition-colors"
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                  Refresh
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={markAllAsRead}
                  disabled={isLoading || !notifications.some(n => !n.read)}
                  className="hover:border-primary transition-colors"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
                
                {notifications.length > 0 && (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={deleteAllNotifications}
                    disabled={isLoading}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-all"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All
                  </Button>
                )}
                
                <Button 
                  size="sm" 
                  onClick={handleCreateTestNotification}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all"
                >
                  <Sparkles className={cn("h-4 w-4 mr-2", isGenerating && "animate-pulse")} />
                  {isGenerating ? 'Creating...' : 'Generate Test'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mb-6">
          <Button
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('all')}
            className={cn(
              "transition-all",
              selectedFilter === 'all' && "shadow-lg"
            )}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={selectedFilter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('unread')}
            className={cn(
              "transition-all",
              selectedFilter === 'unread' && "shadow-lg"
            )}
          >
            Unread ({notifications.filter(n => !n.read).length})
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-b-2 border-primary/30"></div>
            </div>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map((notification, index) => (
              <Card 
                key={notification.id} 
                className={cn(
                  "transition-all duration-300 border-2 animate-scale-fade-in",
                  notification.read ? 'opacity-75' : 'shadow-lg',
                  getNotificationColor(notification.type)
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          {notification.title}
                          {!notification.read && (
                            <Badge variant="default" className="animate-pulse">New</Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getTimeAgo(notification.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-green-50 hover:text-green-600 transition-colors" 
                          onClick={() => markAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 hover:bg-red-50 hover:text-red-600 transition-colors" 
                        onClick={() => deleteNotification(notification.id)}
                        title="Delete notification"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-700 mb-2">{notification.message}</p>
                  
                  {notification.metadata && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleNotificationExpansion(notification.id)}
                      className="text-primary hover:text-primary/80 p-0 h-auto font-medium"
                    >
                      <ChevronDown className={cn(
                        "w-4 h-4 mr-1 transition-transform",
                        expandedNotifications.has(notification.id) && "rotate-180"
                      )} />
                      {expandedNotifications.has(notification.id) ? 'Hide' : 'Show'} Recommendations
                    </Button>
                  )}
                  
                  {renderRecommendationContent(notification)}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-lg border-0">
            <CardContent className="py-12 text-center">
              <div className="relative inline-block">
                <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <div className="absolute bottom-2 right-0 h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">0</span>
                </div>
              </div>
              <p className="text-gray-500 text-lg mb-6">
                {selectedFilter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <Button 
                variant="outline" 
                onClick={handleCreateTestNotification}
                disabled={isGenerating}
                className="hover:border-primary transition-colors"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Test Notification
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}