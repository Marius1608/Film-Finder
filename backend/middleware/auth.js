// middleware/auth.js
import { authenticate } from '../lib/auth';

export default async function authMiddleware(req, res, next) {
  const auth = await authenticate(req);
  
  if (!auth.success) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.user = {
    id: auth.userId,
    email: auth.email
  };
  
  next();
}