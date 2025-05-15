'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function GenreTrendsPage() {
  const router = useRouter();
  const [genreData, setGenreData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGenreTrends();
  }, []);

  const fetchGenreTrends = async () => {
    try {
      const response = await axios.get('/analytics/genre-trends');
      setGenreData(response.data);
    } catch (error) {
      console.error('Error fetching genre trends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        onClick={() => router.back()}
        variant="ghost"
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Genre Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {genreData.map((monthData: any) => (
                <div key={monthData.month} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">{monthData.month}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(monthData.genres).map(([genre, count]) => (
                      <div key={genre} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>{genre}</span>
                        <span className="font-medium">{String(count)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}