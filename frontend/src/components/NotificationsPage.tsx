'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Bell, Check, Film, Info, AlertTriangle, X, RefreshCw, Sparkles, CheckCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

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
  switch (type) {
    case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'error': return <X className="h-5 w-5 text-red-500" />;
    default: return <Info className="h-5 w-5 text-blue-500" />;
  }
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
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
      const response = await axios.get('/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        const sortedNotifications = [...response.data].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setNotifications(sortedNotifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await axios.post(`/notifications/${notificationId}/mark-read`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      await axios.post('/notifications/mark-all-read', {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all as read');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    setIsLoading(true);
    try {
      await axios.delete(`/notifications/${notificationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      setNotifications(notifications.filter(n => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    } finally {
      setIsLoading(false);
    }
  };


  const deleteAllNotifications = async () => {
    if (window.confirm('Are you sure you want to delete all notifications? This cannot be undone.')) {
      setIsLoading(true);
      try {
        await axios.delete('/notifications', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
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
      const response = await axios.get('/movies/popular?limit=30', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const allMovies = response.data || [];
      
      if (allMovies.length === 0) {
        toast.error('Nu sunt filme disponibile pentru notificare');
        setIsGenerating(false);
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
        'Recomandări de filme',
        'Filme care ți-ar putea plăcea',
        'Pentru vizionarea ta',
        'Descoperă filme noi',
        'Adăugate recent pentru tine'
      ];
      
      const notificationMessages = [
        `Încearcă aceste filme: ${movieTitles}`,
        `Credem că ți-ar plăcea: ${movieTitles}`,
        `Selectate special pentru tine: ${movieTitles}`,
        `Filme recomandate astăzi: ${movieTitles}`,
        `Ce-ar fi să vizionezi: ${movieTitles}`
      ];
      
      const notificationTypes = ['info', 'success', 'warning'];
      
      const randomTitle = notificationTitles[Math.floor(Math.random() * notificationTitles.length)];
      const randomMessage = notificationMessages[Math.floor(Math.random() * notificationMessages.length)];
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
          message: randomMessage,
          type: randomType,
          metadata: metadata
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Notificare de test creată cu succes');
      await fetchNotifications();
    } catch (error) {
      console.error('Eroare la crearea notificării de test:', error);
      toast.error('Nu s-a putut crea notificarea de test');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMovieClick = (movieId: number) => {
    router.push(`/movies/${movieId}`);
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const renderRecommendationContent = (notification: Notification) => {
    if (!notification.metadata) return null;
    
    try {
      const metadata = JSON.parse(notification.metadata) as NotificationMetadata;
      
      if ((metadata.type === 'daily_recommendations' || metadata.type === 'test_recommendations') && metadata.movies) {
        return (
          <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded-md">
            <p className="text-sm font-medium">Recommended Movies:</p>
            <div className="grid grid-cols-1 gap-2">
              {metadata.movies.map((movie) => (
                <div 
                  key={movie.id}
                  className="flex items-center p-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer border"
                  onClick={() => handleMovieClick(movie.id)}
                >
                  <Film className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-sm">{movie.title}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
    } catch (error) {
      console.error('Error rendering recommendation content:', error);
    }
    
    return null;
  };

  const getLatestNotificationTime = (): string => {
    if (notifications.length === 0) {
      return 'No notifications yet';
    }
    
    const latestNotification = notifications[0]; 
    return getTimeAgo(latestNotification.created_at);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">Please log in to view your notifications</p>
            <Button 
              className="mt-4" 
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Bell className="w-8 h-8" />
          Notifications
        </h1>
        <p className="text-gray-600">Your updates and recommendations</p>
      </div>

      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium">Notification Controls</h3>
              <p className="text-sm text-gray-500">Latest notification: {getLatestNotificationTime()}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchNotifications}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={markAllAsRead}
                disabled={isLoading || !notifications.some(n => !n.read)}
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
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
              )}
              
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleCreateTestNotification}
                disabled={isGenerating}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isGenerating ? 'Creating...' : 'Generate Notification'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-500">
          {notifications.filter(n => !n.read).length} unread notifications
        </div>
        {notifications.some(n => !n.read) && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={notification.read ? 'opacity-75' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getNotificationIcon(notification.type)}
                    <CardTitle className="text-base">
                      {notification.title}
                      {!notification.read && (
                        <Badge variant="secondary" className="ml-2 text-xs">New</Badge>
                      )}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {getTimeAgo(notification.created_at)}
                    </span>
                    <div className="flex gap-1">
                      {!notification.read && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7" 
                          onClick={() => markAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-red-500 hover:text-red-700" 
                        onClick={() => deleteNotification(notification.id)}
                        title="Delete notification"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{notification.message}</p>
                {renderRecommendationContent(notification)}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Bell className="h-10 w-10 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No notifications to display</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={handleCreateTestNotification}
              disabled={isGenerating}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Test Notification
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}