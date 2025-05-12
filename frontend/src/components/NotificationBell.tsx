'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Film} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Movie {
  id: number;
  title: string;
}

interface NotificationMetadata {
  type: string;
  movies?: Movie[];
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

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchNotifications();
  
      const interval = setInterval(fetchNotifications, 5 * 60 * 1000); 
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get('/notifications');
      
      if (response.data && Array.isArray(response.data)) {
        setNotifications(response.data);
        setUnreadCount(response.data.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await axios.post(`/notifications/${notificationId}/mark-read`);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
   
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.metadata) {
      try {
        const metadata = JSON.parse(notification.metadata) as NotificationMetadata;
        if (metadata.type === 'daily_recommendations' && metadata.movies && metadata.movies.length > 0) {
          router.push(`/movies/${metadata.movies[0].id}`);
        }
      } catch (error) {
        console.error('Error parsing notification metadata:', error);
      }
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-blue-500';
    }
  };

  const renderRecommendationLinks = (notification: Notification) => {
    if (!notification.metadata) return null;
    
    try {
      const metadata = JSON.parse(notification.metadata) as NotificationMetadata;
      
      if (metadata.type === 'daily_recommendations' && metadata.movies) {
        return (
          <div className="mt-2 space-y-1">
            {metadata.movies.map((movie) => (
              <div 
                key={movie.id}
                className="flex items-center p-1 rounded hover:bg-accent cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/movies/${movie.id}`);
                  markAsRead(notification.id);
                }}
              >
                <Film className="h-3 w-3 mr-2 text-primary" />
                <span className="text-xs">{movie.title}</span>
              </div>
            ))}
          </div>
        );
      }
    } catch (error) {
      console.error('Error rendering recommendation links:', error);
    }
    
    return null;
  };

  const createTestNotification = async () => {
    try {
      const response = await axios.get('/movies/popular?limit=3');
      const movies = response.data || [];
      
      if (movies.length === 0) {
        console.error("No movies available for notification");
        return;
      }
      
      const movieTitles = movies.map((movie: { movie_id: number; title: string }) => movie.title).join(', ');

      const metadata = JSON.stringify({
        type: 'daily_recommendations',
        timestamp: new Date().toISOString(),
        movies: movies.map((movie: { movie_id: number; title: string }) => ({
          id: movie.movie_id,
          title: movie.title
        }))
      });
      
      await axios.post('/notifications', null, {
        params: { 
          title: 'Movie Recommendations',
          message: `Check out these films: ${movieTitles}`,
          type: 'info',
          metadata: metadata 
        }
      });
      
      await fetchNotifications();
    } catch (error) {
      console.error('Error creating test notification:', error);
    }
  };

  const renderTestButton = () => {
    if (process.env.NODE_ENV === 'development') {
      return (
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs"
          onClick={createTestNotification}
        >
          Generate Test Notification
        </Button>
      );
    }
    return null;
  };

  if (!user) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <div className="p-2">
          <h3 className="font-semibold">Notifications</h3>
        </div>
        {notifications.length === 0 ? (
          <DropdownMenuItem className="text-center py-6">
            No notifications
          </DropdownMenuItem>
        ) : (
          notifications.map(notification => (
            <DropdownMenuItem 
              key={notification.id}
              className={`p-4 ${!notification.read ? 'bg-accent/5' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start w-full">
                <div className="flex-1">
                  <h4 className={`font-medium ${getNotificationColor(notification.type)}`}>
                    {notification.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  
                  {renderRecommendationLinks(notification)}
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </p>
                </div>
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
        
        <div className="p-2 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => router.push('/notifications')}
          >
            View All Notifications
          </Button>
          {renderTestButton()}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}