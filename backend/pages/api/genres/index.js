// pages/api/genres/index.js
import { openDB } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    
    const db = await openDB();
    
    const genres = await db.all(`
      SELECT g.id, g.name, COUNT(mg.movie_id) as movie_count
      FROM genres g
      LEFT JOIN movie_genres mg ON g.id = mg.genre_id
      GROUP BY g.id
      ORDER BY g.name
    `);
    
    return res.status(200).json(genres);
    
  } catch (error) {
    console.error('Error fetching genres:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}