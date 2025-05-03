
// pages/api/users/lists/[listId]/movies/[movieId].js
import { openDB } from '../../../../../../lib/db';
import { authenticate } from '../../../../../../lib/auth';

export default async function handler(req, res) {

  const auth = await authenticate(req);
  if (!auth.success) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const userId = auth.userId;
  const { listId, movieId } = req.query;
  
  const db = await openDB();
  const list = await db.get(`
    SELECT * FROM user_lists
    WHERE id = ? AND user_id = ?
  `, listId, userId);
  
  if (!list) {
    return res.status(404).json({ error: 'List not found or unauthorized' });
  }
  
  if (req.method === 'DELETE') {
    try {
      const existing = await db.get(`
        SELECT * FROM list_movies
        WHERE list_id = ? AND movie_id = ?
      `, listId, movieId);
      
      if (!existing) {
        return res.status(404).json({ error: 'Movie not in list' });
      }
      
      await db.run(`
        DELETE FROM list_movies
        WHERE list_id = ? AND movie_id = ?
      `, listId, movieId);
      
      return res.status(200).json({ success: true, message: 'Movie removed from list' });
      
    } catch (error) {
      console.error('Error removing movie from list:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  return res.status(405).json({ error: 'Method Not Allowed' });
}