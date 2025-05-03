// pages/api/users/lists/index.js
import { openDB } from '../../../../lib/db';
import { authenticate } from '../../../../lib/auth';

export default async function handler(req, res) {
  
  const auth = await authenticate(req);
  if (!auth.success) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const userId = auth.userId;
  
  if (req.method === 'GET') {
    try {
      const db = await openDB();
      
      const lists = await db.all(`
        SELECT ul.*, COUNT(lm.movie_id) as movie_count
        FROM user_lists ul
        LEFT JOIN list_movies lm ON ul.id = lm.list_id
        WHERE ul.user_id = ?
        GROUP BY ul.id
        ORDER BY ul.name
      `, userId);
      
      return res.status(200).json(lists);
      
    } catch (error) {
      console.error('Error fetching user lists:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  if (req.method === 'POST') {
    try {
      const db = await openDB();
      const { name, description, is_public } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'List name is required' });
      }
      
      const result = await db.run(`
        INSERT INTO user_lists (user_id, name, description, is_public, created_at)
        VALUES (?, ?, ?, ?, ?)
      `, userId, name, description || '', is_public || 0, new Date().toISOString());
      
      return res.status(201).json({ 
        success: true, 
        message: 'List created successfully',
        id: result.lastID
      });
      
    } catch (error) {
      console.error('Error creating list:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  return res.status(405).json({ error: 'Method Not Allowed' });
}
