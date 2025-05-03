// pages/api/users/profile.js
import { openDB } from '../../../lib/db';
import { authenticate } from '../../../lib/auth';

export default async function handler(req, res) {
  
  const auth = await authenticate(req);
  if (!auth.success) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const userId = auth.userId;
  
  if (req.method === 'GET') {
    try {
      const db = await openDB();
      
      const profile = await db.get(`
        SELECT u.id, u.username, u.email, u.created_at, 
               up.display_name, up.bio, up.avatar_url, up.favorite_genre
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = ?
      `, userId);
      
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      const stats = await db.get(`
        SELECT 
          COUNT(DISTINCT uh.movie_id) as watched_count,
          AVG(uh.rating) as avg_rating,
          COUNT(DISTINCT ul.id) as lists_count
        FROM users u
        LEFT JOIN user_history uh ON u.id = uh.user_id
        LEFT JOIN user_lists ul ON u.id = ul.user_id
        WHERE u.id = ?
      `, userId);
      
      const userProfile = {
        ...profile,
        stats
      };
      
      return res.status(200).json(userProfile);
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  if (req.method === 'POST') {
    try {
      const db = await openDB();
      const { display_name, bio, avatar_url, favorite_genre } = req.body;
      
      const existingProfile = await db.get(`
        SELECT * FROM user_profiles WHERE user_id = ?
      `, userId);
      
      if (existingProfile) {
        
        await db.run(`
          UPDATE user_profiles
          SET display_name = ?, bio = ?, avatar_url = ?, favorite_genre = ?
          WHERE user_id = ?
        `, display_name, bio, avatar_url, favorite_genre, userId);
      } else {
       
        await db.run(`
          INSERT INTO user_profiles (user_id, display_name, bio, avatar_url, favorite_genre)
          VALUES (?, ?, ?, ?, ?)
        `, userId, display_name, bio, avatar_url, favorite_genre);
      }
      
      return res.status(200).json({ success: true, message: 'Profile updated successfully' });
      
    } catch (error) {
      console.error('Error updating user profile:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  return res.status(405).json({ error: 'Method Not Allowed' });
}
