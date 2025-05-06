'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MovieCard from '@/components/MovieCard';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookmarkIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

interface WatchlistItem {
  id: number;
  movie_id: number;
  title: string;
  year: number;
  genres: string;
  poster_path?: string;
  added_at: string;
  priority: number;
  notes?: string;
}

export default function WatchlistPage() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [sortBy, setSortBy] = useState('date_added');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWatchlist();
    }
  }, [user]);

  const fetchWatchlist = async () => {
    try {
      const response = await axios.get('/watchlist', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setWatchlist(response.data);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWatchlist = async (itemId: number) => {
    try {
      await axios.delete(`/watchlist/${itemId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setWatchlist(watchlist.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  const sortWatchlist = (list: WatchlistItem[]) => {
    const sorted = [...list];
    switch (sortBy) {
      case 'date_added':
        return sorted.sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime());
      case 'priority':
        return sorted.sort((a, b) => b.priority - a.priority);
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Please login to view your watchlist</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <BookmarkIcon className="w-8 h-8" />
          My Watchlist
        </h1>
        <p className="text-gray-600">Movies you want to watch later</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="text-gray-600">
          {watchlist.length} {watchlist.length === 1 ? 'movie' : 'movies'} in your watchlist
        </div>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_added">Date Added</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="title">Title</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {watchlist.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              Your watchlist is empty. Start adding movies!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {sortWatchlist(watchlist).map((item) => (
            <div key={item.id} className="relative group">
              <MovieCard
                movie={{
                  movie_id: item.movie_id,
                  title: item.title,
                  year: item.year,
                  genres: item.genres,
                  poster_path: item.poster_path
                }}
                onSelect={(movie) => {
                  window.location.href = `/movies/${movie.movie_id}`;
                }}
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFromWatchlist(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {item.priority > 0 && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                  Priority: {item.priority}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}