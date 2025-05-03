// pages/api/movies/search.js
import { openDB } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { query, page = 1, limit = 20 } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const db = await openDB();
    const offset = (page - 1) * limit;
    
    const movies = await db.all(`
      SELECT m.*, GROUP_CONCAT(g.name) as genres_list
      FROM movies m
      LEFT JOIN movie_genres mg ON m.id = mg.movie_id
      LEFT JOIN genres g ON mg.genre_id = g.id
      WHERE m.title LIKE ?
      GROUP BY m.id
      ORDER BY m.popularity DESC
      LIMIT ? OFFSET ?
    `, `%${query}%`, parseInt(limit), offset);
    
    const countResult = await db.get(`
      SELECT COUNT(*) as total
      FROM movies
      WHERE title LIKE ?
    `, `%${query}%`);
    
    return res.status(200).json({
      movies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error searching movies:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}