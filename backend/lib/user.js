// lib/user.js - Modul pentru gestionarea datelor utilizatorilor
import { openDB } from './db';

export async function getUserProfile(userId) {
  const db = await openDB();
  
  const user = await db.get(`
    SELECT id, username, email, created_at
    FROM users
    WHERE id = ?
  `, userId);
  
  if (!user) {
    return null;
  }
  
  const profile = await db.get(`
    SELECT display_name, bio, avatar_url, favorite_genre
    FROM user_profiles
    WHERE user_id = ?
  `, userId);
  
  const stats = await db.get(`
    SELECT 
      COUNT(*) as total_movies,
      AVG(rating) as avg_rating
    FROM user_history
    WHERE user_id = ? AND rating IS NOT NULL
  `, userId);
  
  const favoriteGenres = await db.all(`
    SELECT g.name, COUNT(*) as count
    FROM user_history h
    JOIN movie_genres mg ON h.movie_id = mg.movie_id
    JOIN genres g ON mg.genre_id = g.id
    WHERE h.user_id = ?
    GROUP BY g.id
    ORDER BY count DESC
    LIMIT 3
  `, userId);
  
  return {
    ...user,
    profile: profile || {
      display_name: user.username,
      bio: null,
      avatar_url: null,
      favorite_genre: null
    },
    stats: {
      total_movies: stats?.total_movies || 0,
      avg_rating: stats?.avg_rating || 0,
      favorite_genres: favoriteGenres
    }
  };
}


export async function getUserHistory(userId, options = {}) {
  const db = await openDB();
  
  const {
    page = 1,
    limit = 20,
    sort = 'recent',
    genre = null,
    year = null,
    minRating = null
  } = options;
  
  const params = [userId];
  
  let whereClause = 'h.user_id = ?';
  
  if (genre) {
    whereClause += ' AND g.name = ?';
    params.push(genre);
  }
  
  if (year) {
    whereClause += ' AND m.year = ?';
    params.push(year);
  }
  
  if (minRating) {
    whereClause += ' AND h.rating >= ?';
    params.push(minRating);
  }
  
  let orderClause = '';
  
  if (sort === 'recent') {
    orderClause = 'h.watched_date DESC';
  } else if (sort === 'rating') {
    orderClause = 'h.rating DESC, h.watched_date DESC';
  } else if (sort === 'title') {
    orderClause = 'm.title ASC';
  } else if (sort === 'year') {
    orderClause = 'm.year DESC, h.watched_date DESC';
  }
  
  const offset = (page - 1) * limit;
  
  const history = await db.all(`
    SELECT 
      h.id as history_id,
      h.movie_id,
      h.watched_date,
      h.rating,
      h.notes,
      m.title,
      m.poster_path,
      m.release_date,
      m.year,
      m.vote_average,
      GROUP_CONCAT(g.name) as genres
    FROM user_history h
    JOIN movies m ON h.movie_id = m.id
    LEFT JOIN movie_genres mg ON m.id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.id
    WHERE ${whereClause}
    GROUP BY h.id
    ORDER BY ${orderClause}
    LIMIT ? OFFSET ?
  `, ...params, limit, offset);
  
  const countQuery = `
    SELECT COUNT(DISTINCT h.id) as total
    FROM user_history h
    JOIN movies m ON h.movie_id = m.id
    LEFT JOIN movie_genres mg ON m.id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.id
    WHERE ${whereClause}
  `;
  
  const countResult = await db.get(countQuery, ...params);
  
  return {
    history,
    pagination: {
      page,
      limit,
      total: countResult.total,
      pages: Math.ceil(countResult.total / limit)
    }
  };
}


export async function getUserLists(userId) {
  const db = await openDB();
  
  const lists = await db.all(`
    SELECT ul.*, COUNT(lm.movie_id) as movie_count
    FROM user_lists ul
    LEFT JOIN list_movies lm ON ul.id = lm.list_id
    WHERE ul.user_id = ?
    GROUP BY ul.id
    ORDER BY ul.name
  `, userId);
  
  return lists;
}


export async function getListDetails(listId, userId) {
  const db = await openDB();
  
  const list = await db.get(`
    SELECT * FROM user_lists
    WHERE id = ? AND user_id = ?
  `, listId, userId);
  
  if (!list) {
    return null;
  }
  
  const movies = await db.all(`
    SELECT m.id, m.title, m.poster_path, m.release_date, m.vote_average,
           lm.added_date, GROUP_CONCAT(g.name) as genres
    FROM movies m
    JOIN list_movies lm ON m.id = lm.movie_id
    LEFT JOIN movie_genres mg ON m.id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.id
    WHERE lm.list_id = ?
    GROUP BY m.id
    ORDER BY lm.added_date DESC
  `, listId);
  
  return {
    ...list,
    movies
  };
}


export async function updateUserProfile(userId, profileData) {
  const db = await openDB();
  
  const existingProfile = await db.get(`
    SELECT * FROM user_profiles WHERE user_id = ?
  `, userId);
  
  const { display_name, bio, avatar_url, favorite_genre } = profileData;
  
  try {
    if (existingProfile) {
      await db.run(`
        UPDATE user_profiles
        SET display_name = ?, bio = ?, avatar_url = ?, favorite_genre = ?
        WHERE user_id = ?
      `, display_name, bio, avatar_url, favorite_genre, userId);
    } else {
      
      await db.run(`
        INSERT INTO user_profiles (user_id, display_name, bio, avatar_url, favorite_genre)
        VALUES (?, ?, ?, ?, ?)
      `, userId, display_name, bio, avatar_url, favorite_genre);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
}