// pages/api/stats/global.js
import { openDB } from '../../../lib/db';
import { getGlobalStatistics } from '../../../lib/statistics';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  try {
    const statistics = await getGlobalStatistics();
    
    return res.status(200).json(statistics);
    
  } catch (error) {
    console.error('Error fetching global statistics:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}