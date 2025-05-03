// pages/api/movies/index.js
import { openDB } from '../../lib/db';
import { authenticate } from '../../lib/auth';

export default async function handler(req, res) {
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    page = 1,
    limit = 20,
    genre,
    year,
    sort = 'popularity',
    query
  } = req.query;

  try {
    const db = await openDB();
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT m.*, GROUP_CONCAT(g.name) as genres_list
      FROM movies m
      LEFT JOIN movie_genres mg ON m.id = mg.movie_id
      LEFT JOIN genres g ON mg.genre_id = g.id
    `;
    
    const whereConditions = [];
    const params = [];
    
    if (genre) {
      whereConditions.push(`
        m.id IN (
          SELECT movie_id FROM movie_genres mg
          JOIN genres g ON mg.genre_id = g.id
          WHERE g.name = ?
        )
      `);
      params.push(genre);
    }
    
    if (year) {
      whereConditions.push('m.year = ?');
      params.push(year);
    }
    
    if (query) {
      whereConditions.push('m.title LIKE ?');
      params.push(`%${query}%`);
    }
    
    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    sql += ' GROUP BY m.id';
    
    if (sort === 'title') {
      sql += ' ORDER BY m.title ASC';
    } else if (sort === 'year') {
      sql += ' ORDER BY m.year DESC';
    } else if (sort === 'rating') {
      sql += ' ORDER BY m.vote_average DESC';
    } else {
      sql += ' ORDER BY m.popularity DESC';
    }
    
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const movies = await db.all(sql, ...params);
    
    let countSql = 'SELECT COUNT(*) as total FROM movies m';
    
    if (whereConditions.length > 0) {
      countSql += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    const countResult = await db.get(countSql, ...params.slice(0, params.length - 2));
    const total = countResult.total;
    
    return res.status(200).json({
      movies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching movies:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}