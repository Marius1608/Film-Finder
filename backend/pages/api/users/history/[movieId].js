// pages/api/users/history/[movieId].js
import { openDB } from '../../../../lib/db';
import { authenticate } from '../../../../lib/auth';

export default async function handler(req, res) {
  
  const auth = await authenticate(req);
  if (!auth.success) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const userId = auth.userId;
  const { movieId } = req.query;
  
  if (req.method === 'PATCH') {
    try {
      const db = await openDB();
      const { rating, notes } = req.body;
      
      const entry = await db.get(`
        SELECT id FROM user_history
        WHERE user_id = ? AND movie_id = ?
      `, userId, movieId);
      
      if (!entry) {
        return res.status(404).json({ error: 'History entry not found' });
      }
      
      await db.run(`
        UPDATE user_history
        SET rating = ?, notes = ?
        WHERE id = ?
      `, rating, notes, entry.id);
      
      return res.status(200).json({ success: true, message: 'History entry updated' });
      
    } catch (error) {
      console.error('Error updating history entry:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  if (req.method === 'DELETE') {
    try {
      const db = await openDB();
      
      const entry = await db.get(`
        SELECT id FROM user_history
        WHERE user_id = ? AND movie_id = ?
      `, userId, movieId);
      
      if (!entry) {
        return res.status(404).json({ error: 'History entry not found' });
      }
      
      await db.run(`
        DELETE FROM user_history
        WHERE id = ?
      `, entry.id);
      
      return res.status(200).json({ success: true, message: 'History entry deleted' });
      
    } catch (error) {
      console.error('Error deleting history entry:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  return res.status(405).json({ error: 'Method Not Allowed' });
}
