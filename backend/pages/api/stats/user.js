// pages/api/stats/user.js
import { openDB } from '../../../lib/db';
import { authenticate } from '../../../lib/auth';
import { getUserStatistics } from '../../../lib/statistics';

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
    
    const statistics = await getUserStatistics(userId);
    
    return res.status(200).json(statistics);
    
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}