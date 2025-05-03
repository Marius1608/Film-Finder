// pages/api/users/history/index.js
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
      const { page = 1, limit = 20, sort = 'recent' } = req.query;
      const offset = (page - 1) * limit;
      
      let orderBy = '';
      if (sort === 'recent') {
        orderBy = 'uh.watched_date DESC';
      } else if (sort === 'rating') {
        orderBy = 'uh.rating DESC';
      } else if (sort === 'title') {
        orderBy = 'm.title ASC';
      }
      
      const history = await db.all(`
        SELECT uh.*, m.id as movie_id, m.title, m.poster_path, m.release_date,
               m.vote_average, GROUP_CONCAT(g.name) as genres
        FROM user_history uh
        JOIN movies m ON uh.movie_id = m.id
        LEFT JOIN movie_genres mg ON m.id = mg.movie_id
        LEFT JOIN genres g ON mg.genre_id = g.id
        WHERE uh.user_id = ?
        GROUP BY uh.id
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `, userId, parseInt(limit), offset);
      
      const countResult = await db.get(`
        SELECT COUNT(*) as total
        FROM user_history
        WHERE user_id = ?
      `, userId);
      
      return res.status(200).json({
        history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      });
      
    } catch (error) {
      console.error('Error fetching user history:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  if (req.method === 'POST') {
    try {
      const db = await openDB();
      const { movie_id, watched_date, rating, notes } = req.body;
      
      if (!movie_id) {
        return res.status(400).json({ error: 'Movie ID is required' });
      }
      
      const movie = await db.get(`SELECT id FROM movies WHERE id = ?`, movie_id);
      if (!movie) {
        return res.status(404).json({ error: 'Movie not found' });
      }
      
      const existingEntry = await db.get(`
        SELECT id FROM user_history
        WHERE user_id = ? AND movie_id = ?
      `, userId, movie_id);
      
      if (existingEntry) {
        
        await db.run(`
          UPDATE user_history
          SET watched_date = ?, rating = ?, notes = ?
          WHERE id = ?
        `, watched_date || new Date().toISOString(), rating || null, notes || null, existingEntry.id);
        
        return res.status(200).json({ 
          success: true, 
          message: 'History entry updated',
          id: existingEntry.id
        });
      } else {
        
        const result = await db.run(`
          INSERT INTO user_history (user_id, movie_id, watched_date, rating, notes)
          VALUES (?, ?, ?, ?, ?)
        `, userId, movie_id, watched_date || new Date().toISOString(), rating || null, notes || null);
        
        return res.status(201).json({ 
          success: true, 
          message: 'Movie added to history',
          id: result.lastID
        });
      }
      
    } catch (error) {
      console.error('Error adding movie to history:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  return res.status(405).json({ error: 'Method Not Allowed' });
}