// src/app/movies/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import MovieDetailPage from '@/components/MovieDetailPage';
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>}>
      <ClientMovieDetail />
    </Suspense>
  );
}

function ClientMovieDetail() {
  const params = useParams();
  const movieId = typeof params.id === 'string' ? parseInt(params.id, 10) : 
                 Array.isArray(params.id) ? parseInt(params.id[0], 10) : 0;
  
  if (!movieId) {
    return <div>Invalid movie ID</div>;
  }

  return <MovieDetailPage movieId={movieId} />;
}