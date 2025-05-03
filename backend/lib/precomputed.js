import { openDB } from './db';

export async function getPrecomputedData(type, key) {
  const db = await openDB();
  
  const data = await db.get(`
    SELECT value FROM precomputed_data
    WHERE type = ? AND key = ?
  `, type, key);
  
  if (!data) return null;
  
  try {
    return JSON.parse(data.value);
  } catch (e) {
    return data.value;
  }
}

export async function setPrecomputedData(type, key, value) {
  const db = await openDB();
  const now = new Date().toISOString();
  
  const stringValue = typeof value === 'object' 
    ? JSON.stringify(value) 
    : value.toString();
  
  await db.run(`
    INSERT INTO precomputed_data (type, key, value, created_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(type, key) DO UPDATE SET
      value = excluded.value,
      created_at = excluded.created_at
  `, type, key, stringValue, now);
  
  return true;
}