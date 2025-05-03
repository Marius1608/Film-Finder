// lib/search.js - Modul pentru funcționalități de căutare
import { openDB } from './db';

export async function searchMovies(query, options = {}) {
  const db = await openDB();
  
  const {
    page = 1,
    limit = 20,
    genre = null,
    year = null,
    minRating = null,
    sort = 'relevance'
  } = options;
  
  const params = [`%${query}%`];
  
  let whereClause = 'm.title LIKE ?';
  
  if (genre) {
    whereClause += ' AND g.name = ?';
    params.push(genre);
  }
  
  if (year) {
    whereClause += ' AND m.year = ?';
    params.push(year);
  }
  
  if (minRating) {
    whereClause += ' AND m.vote_average >= ?';
    params.push(minRating);
  }
  
  let orderClause = '';
  
  if (sort === 'relevance') {
    orderClause = `
      CASE 
        WHEN m.title LIKE ? THEN 1
        WHEN m.title LIKE ? THEN 2
        ELSE 3
      END, m.popularity DESC
    `;
    params.push(`${query}%`, `% ${query}%`);
  } else if (sort === 'popularity') {
    orderClause = 'm.popularity DESC';
  } else if (sort === 'rating') {
    orderClause = 'm.vote_average DESC';
  } else if (sort === 'year') {
    orderClause = 'm.year DESC';
  } else if (sort === 'title') {
    orderClause = 'm.title ASC';
  }
  
  const offset = (page - 1) * limit;
  
  const movies = await db.all(`
    SELECT 
      m.id,
      m.title,
      m.poster_path,
      m.release_date,
      m.year,
      m.vote_average,
      m.popularity,
      m.overview,
      GROUP_CONCAT(g.name) as genres
    FROM movies m
    LEFT JOIN movie_genres mg ON m.id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.id
    WHERE ${whereClause}
    GROUP BY m.id
    ORDER BY ${orderClause}
    LIMIT ? OFFSET ?
  `, ...params, limit, offset);
  
  const countQuery = `
    SELECT COUNT(DISTINCT m.id) as total
    FROM movies m
    LEFT JOIN movie_genres mg ON m.id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.id
    WHERE ${whereClause}
  `;
  
  const countResult = await db.get(countQuery, ...params.slice(0, params.length - 2));
  
  return {
    movies,
    pagination: {
      page,
      limit,
      total: countResult.total,
      pages: Math.ceil(countResult.total / limit)
    }
  };
}


export async function getSearchSuggestions(query, limit = 10) {
  if (!query || query.length < 2) {
    return [];
  }
  
  const db = await openDB();
  
  const suggestions = await db.all(`
    SELECT title
    FROM movies
    WHERE title LIKE ?
    ORDER BY popularity DESC
    LIMIT ?
  `, `%${query}%`, limit);
  
  return suggestions.map(s => s.title);
}


export async function searchPersons(query, options = {}) {
  const db = await openDB();
  
  const {
    page = 1,
    limit = 20,
    role = null 
  } = options;
  
  const params = [`%${query}%`];
  
  let whereClause = 'p.name LIKE ?';
  
  let joinClause = '';
  let groupByClause = 'GROUP BY p.id';
  let havingClause = '';
  
  if (role === 'actor') {
    joinClause = 'JOIN movie_cast mc ON p.id = mc.person_id';
  } else if (role === 'director') {
    joinClause = `
      JOIN movie_crew mc ON p.id = mc.person_id
      WHERE mc.job = 'Director' AND p.name LIKE ?
    `;
    params.push(`%${query}%`);
    whereClause = '1=1'; 
  }
  
  const offset = (page - 1) * limit;
  
  let sql = `
    SELECT 
      p.id,
      p.name,
      p.profile_path,
      COUNT(DISTINCT mc.movie_id) as movie_count
    FROM persons p
    ${joinClause}
    WHERE ${whereClause}
    ${groupByClause}
    ${havingClause}
    ORDER BY movie_count DESC, p.name
    LIMIT ? OFFSET ?
  `;
  
  const persons = await db.all(sql, ...params, limit, offset);
  
  for (const person of persons) {
    if (role === 'actor') {
      person.movies = await db.all(`
        SELECT m.id, m.title, mc.character
        FROM movies m
        JOIN movie_cast mc ON m.id = mc.movie_id
        WHERE mc.person_id = ?
        ORDER BY m.popularity DESC
        LIMIT 5
      `, person.id);
    } else if (role === 'director') {
      person.movies = await db.all(`
        SELECT m.id, m.title
        FROM movies m
        JOIN movie_crew mc ON m.id = mc.movie_id
        WHERE mc.person_id = ? AND mc.job = 'Director'
        ORDER BY m.popularity DESC
        LIMIT 5
      `, person.id);
    } else {
      
      const actorMovies = await db.all(`
        SELECT m.id, m.title, 'Actor' as role, mc.character
        FROM movies m
        JOIN movie_cast mc ON m.id = mc.movie_id
        WHERE mc.person_id = ?
        ORDER BY m.popularity DESC
        LIMIT 3
      `, person.id);
      
      const directorMovies = await db.all(`
        SELECT m.id, m.title, 'Director' as role
        FROM movies m
        JOIN movie_crew mc ON m.id = mc.movie_id
        WHERE mc.person_id = ? AND mc.job = 'Director'
        ORDER BY m.popularity DESC
        LIMIT 3
      `, person.id);
      
      person.movies = [...actorMovies, ...directorMovies].sort((a, b) => 
        b.popularity - a.popularity
      ).slice(0, 5);
    }
  }
  
  let countSql = `
    SELECT COUNT(DISTINCT p.id) as total
    FROM persons p
    ${joinClause}
    WHERE ${whereClause}
    ${havingClause}
  `;
  
  const countResult = await db.get(countSql, ...params);
  
  return {
    persons,
    pagination: {
      page,
      limit,
      total: countResult.total,
      pages: Math.ceil(countResult.total / limit)
    }
  };
}


export async function getPersonDetails(personId) {
  const db = await openDB();
  
  const person = await db.get(`
    SELECT * FROM persons
    WHERE id = ?
  `, personId);
  
  if (!person) {
    return null;
  }
  
  person.acting = await db.all(`
    SELECT m.id, m.title, m.poster_path, m.release_date, m.vote_average, mc.character
    FROM movies m
    JOIN movie_cast mc ON m.id = mc.movie_id
    WHERE mc.person_id = ?
    ORDER BY m.popularity DESC
  `, personId);
  
  person.directing = await db.all(`
    SELECT m.id, m.title, m.poster_path, m.release_date, m.vote_average
    FROM movies m
    JOIN movie_crew mc ON m.id = mc.movie_id
    WHERE mc.person_id = ? AND mc.job = 'Director'
    ORDER BY m.popularity DESC
  `, personId);
  
  person.crew = await db.all(`
    SELECT m.id, m.title, mc.job
    FROM movies m
    JOIN movie_crew mc ON m.id = mc.movie_id
    WHERE mc.person_id = ? AND mc.job != 'Director'
    ORDER BY m.popularity DESC
  `, personId);
  
  return person;
}
