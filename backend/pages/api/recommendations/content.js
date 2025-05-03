// pages/api/recommendations/content.js
import { openDB } from '../../../lib/db';
import { authenticate } from '../../../lib/auth';
import { getContentBasedRecommendations } from '../../../lib/recommendations';

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
    const { limit = 20 } = req.query;
    
    const recommendations = await getContentBasedRecommendations(userId, parseInt(limit));
    
    return res.status(200).json(recommendations);
    
  } catch (error) {
    console.error('Error fetching content-based recommendations:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}