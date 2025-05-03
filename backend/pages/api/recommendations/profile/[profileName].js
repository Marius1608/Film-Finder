// pages/api/recommendations/profile/[profileName].js
import { openDB } from '../../../../lib/db';
import { getProfileRecommendations } from '../../../../lib/recommendations';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  const { profileName } = req.query;
  const { limit = 20 } = req.query;
  
  const validProfiles = [
    'action_fan', 
    'drama_lover', 
    'comedy_enthusiast', 
    'thriller_addict', 
    'documentary_watcher',
    'family_viewer',
    'classic_cinephile',
    'international_fan',
    'musical_appreciator'
  ];
  
  if (!validProfiles.includes(profileName)) {
    return res.status(400).json({ 
      error: 'Invalid profile name',
      valid_profiles: validProfiles
    });
  }
  
  try {
    
    const recommendations = await getProfileRecommendations(
      profileName, 
      parseInt(limit)
    );
    
    return res.status(200).json(recommendations);
    
  } catch (error) {
    console.error('Error fetching profile recommendations:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}