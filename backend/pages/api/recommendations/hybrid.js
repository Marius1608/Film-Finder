// pages/api/recommendations/hybrid.js
import { openDB } from '../../../lib/db';
import { authenticate } from '../../../lib/auth';
import { getHybridRecommendations } from '../../../lib/recommendations';

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
    const { limit = 20, weights } = req.query;
    
    let weightValues = {
      content: 0.4,
      collaborative_user: 0.3,
      collaborative_item: 0.3
    };
    
    if (weights) {
      try {
        const parsedWeights = JSON.parse(weights);
        weightValues = {
          ...weightValues,
          ...parsedWeights
        };
      } catch (e) {
        console.error('Error parsing weights:', e);
      }
    }
    
    const recommendations = await getHybridRecommendations(
      userId, 
      parseInt(limit),
      weightValues
    );
    
    return res.status(200).json(recommendations);
    
  } catch (error) {
    console.error('Error fetching hybrid recommendations:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}