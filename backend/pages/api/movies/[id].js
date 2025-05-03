// pages/api/movies/[id].js
import { openDB } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;

  try {
    const db = await openDB();
    
    const movie = await db.get(`
      SELECT m.*
      FROM movies m
      WHERE m.id = ?
    `, id);
    
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    const genres = await db.all(`
      SELECT g.id, g.name
      FROM genres g
      JOIN movie_genres mg ON g.id = mg.genre_id
      WHERE mg.movie_id = ?
    `, id);
    
    const cast = await db.all(`
      SELECT p.id, p.name, p.profile_path, mc.character
      FROM persons p
      JOIN movie_cast mc ON p.id = mc.person_id
      WHERE mc.movie_id = ?
      ORDER BY mc.order_number
      LIMIT 10
    `, id);
    
    const crew = await db.all(`
      SELECT p.id, p.name, p.profile_path, mc.job, mc.department
      FROM persons p
      JOIN movie_crew mc ON p.id = mc.person_id
      WHERE mc.movie_id = ?
    `, id);
    
    const movieDetails = {
      ...movie,
      genres,
      cast,
      crew
    };
    
    return res.status(200).json(movieDetails);
    
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}