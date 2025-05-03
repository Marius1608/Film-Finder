// pages/api/movies/similar/[id].js
import { openDB } from '../../../../lib/db';
import { getMovieSimilarity } from '../../../../lib/recommendations';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  const { limit = 10 } = req.query;

  try {
    const similarMovies = await getMovieSimilarity(id, parseInt(limit));
    
    return res.status(200).json(similarMovies);
    
  } catch (error) {
    console.error('Error fetching similar movies:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}