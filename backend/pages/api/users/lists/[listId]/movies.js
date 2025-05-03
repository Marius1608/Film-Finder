// pages/api/users/lists/[listId]/movies.js
import { openDB } from '../../../../../lib/db';
import { authenticate } from '../../../../../lib/auth';

export default async function handler(req, res) {
 
  const auth = await authenticate(req);
  if (!auth.success) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const userId = auth.userId;
  const { listId } = req.query;
  
  const db = await openDB();
  const list = await db.get(`
    SELECT * FROM user_lists
    WHERE id = ? AND user_id = ?
  `, listId, userId);
  
  if (!list) {
    return res.status(404).json({ error: 'List not found or unauthorized' });
  }
  
  if (req.method === 'POST') {
    try {
      const { movie_id } = req.body;
      
      if (!movie_id) {
        return res.status(400).json({ error: 'Movie ID is required' });
      }
      
      const movie = await db.get(`SELECT id FROM movies WHERE id = ?`, movie_id);
      if (!movie) {
        return res.status(404).json({ error: 'Movie not found' });
      }
      
      const existing = await db.get(`
        SELECT * FROM list_movies
        WHERE list_id = ? AND movie_id = ?
      `, listId, movie_id);
      
      if (existing) {
        return res.status(400).json({ error: 'Movie already in list' });
      }
      
      await db.run(`
        INSERT INTO list_movies (list_id, movie_id, added_date)
        VALUES (?, ?, ?)
      `, listId, movie_id, new Date().toISOString());
      
      return res.status(201).json({ success: true, message: 'Movie added to list' });
      
    } catch (error) {
      console.error('Error adding movie to list:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  return res.status(405).json({ error: 'Method Not Allowed' });
}