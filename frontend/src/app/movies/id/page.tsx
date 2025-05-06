import MovieDetailPage from '@/components/MovieDetailPage';

export default function Page({ params }: { params: { id: string } }) {
  return <MovieDetailPage movieId={parseInt(params.id)} />;
}