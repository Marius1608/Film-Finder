// pages/api/recommendations/collaborative.js
import { openDB } from '../../../lib/db';
import { authenticate } from '../../../lib/auth';
import { getCollaborativeFilteringRecommendations } from '../../../lib/recommendations';

export default async function handler(req, res) {
 
  const auth = await authenticate(req);
  if (!auth.success) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const userId = auth.userId;
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  try {
    const { limit = 20, method = 'user' } = req.query;
    
    if (method !== 'user' && method !== 'item') {
      return res.status(400).json({ error: 'Invalid method. Use "user" or "item"' });
    }
    
    const recommendations = await getCollaborativeFilteringRecommendations(
      userId, 
      parseInt(limit),
      method
    );
    
    return res.status(200).json(recommendations);
    
  } catch (error) {
    console.error('Error fetching collaborative filtering recommendations:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}