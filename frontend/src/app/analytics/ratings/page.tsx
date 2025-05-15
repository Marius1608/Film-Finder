'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function RatingAnalyticsPage() {
  const router = useRouter();
  const [ratingData, setRatingData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRatingDistribution();
  }, []);

  const fetchRatingDistribution = async () => {
    try {
      const response = await axios.get('/analytics/rating-distribution');
      setRatingData(response.data);
    } catch (error) {
      console.error('Error fetching rating distribution:', error);
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
            <BarChart3 className="w-6 h-6" />
            Rating Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {ratingData.map((item: any) => (
                <div key={item.rating} className="flex items-center gap-4">
                  <div className="w-20">{item.rating} Stars</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary rounded-full"
                      style={{ width: `${(item.count / 10) * 100}%` }}
                    />
                  </div>
                  <div className="w-16 text-right">{item.count}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}