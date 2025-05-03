// lib/auth.js 
import { openDB } from './db';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';


export async function loginUser(email, password) {
  const db = await openDB();
  
  const user = await db.get('SELECT * FROM users WHERE email = ?', email);
  
  if (!user) {
    return { success: false, error: 'Utilizator negăsit' };
  }
  
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  
  if (!passwordMatch) {
    return { success: false, error: 'Parolă incorectă' };
  }
  
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email
    },
    token
  };
}


export async function registerUser(username, email, password) {
  const db = await openDB();
  
  const existingUser = await db.get(
    'SELECT * FROM users WHERE email = ? OR username = ?',
    email, username
  );
  
  if (existingUser) {
    if (existingUser.email === email) {
      return { success: false, error: 'Email-ul este deja utilizat' };
    } else {
      return { success: false, error: 'Numele de utilizator este deja utilizat' };
    }
  }
  
  const passwordHash = await bcrypt.hash(password, 10);
  
  const now = new Date().toISOString();
  
  const result = await db.run(
    `INSERT INTO users (username, email, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    username, email, passwordHash, now, now
  );
  
  const token = jwt.sign(
    { userId: result.lastID, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  return {
    success: true,
    user: {
      id: result.lastID,
      username,
      email
    },
    token
  };
}


export async function authenticate(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: 'Token lipsă sau invalid' };
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const db = await openDB();
    const user = await db.get('SELECT id FROM users WHERE id = ?', decoded.userId);
    
    if (!user) {
      return { success: false, error: 'Utilizatorul nu există' };
    }
    
    return {
      success: true,
      userId: decoded.userId,
      email: decoded.email
    };
    
  } catch (error) {
    return { success: false, error: 'Token invalid sau expirat' };
  }
}


export async function generateApiKey(userId) {
  const db = await openDB();
  
  const apiKey = crypto.randomBytes(20).toString('hex');
  
  const existingKey = await db.get(
    'SELECT id FROM api_keys WHERE user_id = ?',
    userId
  );
  
  const now = new Date().toISOString();
  
  if (existingKey) {
    await db.run(
      'UPDATE api_keys SET api_key = ?, created_at = ? WHERE user_id = ?',
      apiKey, now, userId
    );
  } else {
    await db.run(
      'INSERT INTO api_keys (user_id, api_key, created_at) VALUES (?, ?, ?)',
      userId, apiKey, now
    );
  }
  
  return apiKey;
}


export async function validateApiKey(apiKey) {
  const db = await openDB();
  
  const key = await db.get(
    'SELECT user_id FROM api_keys WHERE api_key = ?',
    apiKey
  );
  
  if (!key) {
    return { success: false, error: 'Cheie API invalidă' };
  }
  
  return {
    success: true,
    userId: key.user_id
  };
}