'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MovieCard from '@/components/MovieCard';
import { Card, CardContent} from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookmarkIcon, Trash2, Calendar, Star, SortAsc, 
  Film, Clock, Plus, Search, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [removingItems, setRemovingItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user) {
      fetchWatchlist();
    }
  }, [user]);

  const fetchWatchlist = async () => {
    try {
      const response = await axios.get('/watchlist');
      setWatchlist(response.data);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      toast.error('Failed to load watchlist');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWatchlist = async (itemId: number) => {
    setRemovingItems(prev => new Set(prev).add(itemId));
    try {
      await axios.delete(`/watchlist/${itemId}`);
      setWatchlist(watchlist.filter(item => item.id !== itemId));
      toast.success('Removed from watchlist');
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast.error('Failed to remove from watchlist');
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
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
      case 'year':
        return sorted.sort((a, b) => b.year - a.year);
      default:
        return sorted;
    }
  };

  const allGenres = Array.from(new Set(
    watchlist.flatMap(item => item.genres?.split('|') || [])
  )).filter(Boolean).sort();

  const filteredWatchlist = watchlist.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || item.genres?.includes(selectedGenre);
    return matchesSearch && matchesGenre;
  });

  const sortedWatchlist = sortWatchlist(filteredWatchlist);

  const stats = {
    total: watchlist.length,
    highPriority: watchlist.filter(item => item.priority >= 3).length,
    recentlyAdded: watchlist.filter(item => {
      const daysSinceAdded = (Date.now() - new Date(item.added_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceAdded <= 7;
    }).length
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <Card className="max-w-md w-full shadow-xl border-0 animate-scale-in">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="p-4 bg-primary/10 rounded-full inline-block mb-4">
              <BookmarkIcon className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Login Required</h3>
            <p className="text-gray-500 mb-4">Please login to view your watchlist</p>
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="relative">
          <BookmarkIcon className="w-16 h-16 text-primary animate-pulse" />
          <div className="absolute inset-0 animate-ping">
            <BookmarkIcon className="w-16 h-16 text-primary/30" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
              <BookmarkIcon className="w-10 h-10 text-white" />
            </div>
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              My Watchlist
            </span>
          </h1>
          <p className="text-gray-600 text-lg">Keep track of movies you want to watch</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-lg animate-scale-in hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Movies</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Film className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg animate-scale-in hover:shadow-xl transition-shadow" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">High Priority</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.highPriority}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg animate-scale-in hover:shadow-xl transition-shadow" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Recently Added</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.recentlyAdded}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 shadow-lg border-0 animate-slide-up">
          <CardContent className="py-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="search"
                    placeholder="Search movies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 border-2 hover:border-primary/50 focus:border-primary transition-colors"
                  />
                </div>

                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="w-full sm:w-[180px] h-11 border-2 hover:border-primary/50 transition-colors">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    {allGenres.map(genre => (
                      <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px] h-11 border-2 hover:border-primary/50 transition-colors">
                    <SortAsc className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_added">Date Added</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
                    <SelectItem value="year">Release Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={() => window.location.href = '/movies'}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Movies
              </Button>
            </div>
          </CardContent>
        </Card>

        {filteredWatchlist.length !== watchlist.length && (
          <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Showing {filteredWatchlist.length} of {watchlist.length} movies
          </div>
        )}

        {sortedWatchlist.length === 0 ? (
          <Card className="shadow-xl border-0">
            <CardContent className="py-12 text-center">
              <div className="relative inline-block mb-6">
                <Film className="w-20 h-20 text-gray-300" />
                <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1">
                  <Plus className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {watchlist.length === 0 ? 'Your watchlist is empty' : 'No movies match your filters'}
              </h3>
              <p className="text-gray-500 mb-6">
                {watchlist.length === 0 
                  ? 'Start adding movies you want to watch later!' 
                  : 'Try adjusting your search or filters'}
              </p>
              {watchlist.length === 0 && (
                <Button 
                  onClick={() => window.location.href = '/movies'}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  <Film className="w-4 h-4 mr-2" />
                  Browse Movies
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {sortedWatchlist.map((item, index) => (
              <div 
                key={item.id} 
                className="relative group animate-scale-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
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
                  index={index}
                />
                
                <Button
                  variant="destructive"
                  size="icon"
                  className={cn(
                    "absolute top-2 right-2 shadow-lg transition-all duration-300",
                    "opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-100",
                    removingItems.has(item.id) && "animate-spin"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWatchlist(item.id);
                  }}
                  disabled={removingItems.has(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                
                {item.priority > 0 && (
                  <div className={cn(
                    "absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold shadow-lg",
                    "bg-gradient-to-r text-white",
                    item.priority >= 4 ? "from-red-500 to-orange-500" :
                    item.priority >= 2 ? "from-yellow-500 to-amber-500" :
                    "from-blue-500 to-cyan-500"
                  )}>
                    Priority: {item.priority}
                  </div>
                )}
                
                <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {new Date(item.added_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}