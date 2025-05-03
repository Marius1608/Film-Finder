// pages/api/users/lists/[listId].js
import { openDB } from '../../../../lib/db';
import { authenticate } from '../../../../lib/auth';

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
  
  if (req.method === 'GET') {
    try {
      const movies = await db.all(`
        SELECT m.id, m.title, m.poster_path, m.release_date, m.vote_average,
               lm.added_date, GROUP_CONCAT(g.name) as genres
        FROM movies m
        JOIN list_movies lm ON m.id = lm.movie_id
        LEFT JOIN movie_genres mg ON m.id = mg.movie_id
        LEFT JOIN genres g ON mg.genre_id = g.id
        WHERE lm.list_id = ?
        GROUP BY m.id
        ORDER BY lm.added_date DESC
      `, listId);
      
      return res.status(200).json({
        list,
        movies
      });
      
    } catch (error) {
      console.error('Error fetching list details:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  if (req.method === 'PATCH') {
    try {
      const { name, description, is_public } = req.body;
      
      await db.run(`
        UPDATE user_lists
        SET name = ?, description = ?, is_public = ?
        WHERE id = ?
      `, name || list.name, 
         description !== undefined ? description : list.description, 
         is_public !== undefined ? is_public : list.is_public,
         listId);
      
      return res.status(200).json({ success: true, message: 'List updated successfully' });
      
    } catch (error) {
      console.error('Error updating list:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  if (req.method === 'DELETE') {
    try {
      await db.run(`DELETE FROM list_movies WHERE list_id = ?`, listId);
      
      await db.run(`DELETE FROM user_lists WHERE id = ?`, listId);
      
      return res.status(200).json({ success: true, message: 'List deleted successfully' });
      
    } catch (error) {
      console.error('Error deleting list:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  return res.status(405).json({ error: 'Method Not Allowed' });
}
