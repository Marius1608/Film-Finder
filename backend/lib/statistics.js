// lib/statistics.js - Modul pentru statistici și analize
import { openDB } from './db';

export async function getUserStatistics(userId) {
  const db = await openDB();
  
  const totalCount = await db.get(`
    SELECT COUNT(*) as count
    FROM user_history
    WHERE user_id = ?
  `, userId);
  
  const avgRating = await db.get(`
    SELECT AVG(rating) as avg
    FROM user_history
    WHERE user_id = ? AND rating IS NOT NULL
  `, userId);
  
  const ratingDistribution = await db.all(`
    SELECT rating, COUNT(*) as count
    FROM user_history
    WHERE user_id = ? AND rating IS NOT NULL
    GROUP BY rating
    ORDER BY rating
  `, userId);
  
  const genreDistribution = await db.all(`
    SELECT g.name, COUNT(*) as count
    FROM user_history h
    JOIN movie_genres mg ON h.movie_id = mg.movie_id
    JOIN genres g ON mg.genre_id = g.id
    WHERE h.user_id = ?
    GROUP BY g.id
    ORDER BY count DESC
  `, userId);
  
  const yearDistribution = await db.all(`
    SELECT m.year, COUNT(*) as count
    FROM user_history h
    JOIN movies m ON h.movie_id = m.id
    WHERE h.user_id = ? AND m.year IS NOT NULL
    GROUP BY m.year
    ORDER BY m.year
  `, userId);
  
  const recentlyWatched = await db.all(`
    SELECT h.*, m.title, m.poster_path
    FROM user_history h
    JOIN movies m ON h.movie_id = m.id
    WHERE h.user_id = ?
    ORDER BY h.watched_date DESC
    LIMIT 5
  `, userId);
  
  const favoriteActors = await db.all(`
    SELECT p.name, COUNT(*) as count
    FROM user_history h
    JOIN movie_cast mc ON h.movie_id = mc.movie_id
    JOIN persons p ON mc.person_id = p.id
    WHERE h.user_id = ?
    GROUP BY p.id
    ORDER BY count DESC
    LIMIT 5
  `, userId);
  
  const favoriteDirectors = await db.all(`
    SELECT p.name, COUNT(*) as count
    FROM user_history h
    JOIN movie_crew mc ON h.movie_id = mc.movie_id
    JOIN persons p ON mc.person_id = p.id
    WHERE h.user_id = ? AND mc.job = 'Director'
    GROUP BY p.id
    ORDER BY count DESC
    LIMIT 5
  `, userId);
  
  const monthlyStats = await db.all(`
    SELECT 
      strftime('%Y-%m', watched_date) as month,
      COUNT(*) as count,
      AVG(rating) as avg_rating
    FROM user_history
    WHERE user_id = ?
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `, userId);
  
  const totalDuration = await db.get(`
    SELECT SUM(m.runtime) as total
    FROM user_history h
    JOIN movies m ON h.movie_id = m.id
    WHERE h.user_id = ? AND m.runtime IS NOT NULL
  `, userId);
  
  return {
    total_movies: totalCount.count,
    avg_rating: avgRating.avg || 0,
    rating_distribution: ratingDistribution,
    genre_distribution: genreDistribution,
    year_distribution: yearDistribution,
    recently_watched: recentlyWatched,
    favorite_actors: favoriteActors,
    favorite_directors: favoriteDirectors,
    monthly_stats: monthlyStats,
    total_duration: totalDuration.total || 0,
    total_duration_formatted: formatDuration(totalDuration.total || 0)
  };
}


export async function getGlobalStatistics() {
  const db = await openDB();
  
  const totalMovies = await db.get(`
    SELECT COUNT(*) as count FROM movies
  `);
  
  const totalUsers = await db.get(`
    SELECT COUNT(*) as count FROM users
  `);
  
  const totalRatings = await db.get(`
    SELECT COUNT(*) as count FROM user_history WHERE rating IS NOT NULL
  `);
  
  const avgRating = await db.get(`
    SELECT AVG(rating) as avg FROM user_history WHERE rating IS NOT NULL
  `);
  
  const yearDistribution = await db.all(`
    SELECT year, COUNT(*) as count
    FROM movies
    WHERE year IS NOT NULL
    GROUP BY year
    ORDER BY year
  `);
  
  const genreDistribution = await db.all(`
    SELECT g.name, COUNT(*) as count
    FROM movie_genres mg
    JOIN genres g ON mg.genre_id = g.id
    GROUP BY g.id
    ORDER BY count DESC
  `);
  
  const mostPopular = await db.all(`
    SELECT id, title, poster_path, release_date, vote_average, popularity
    FROM movies
    ORDER BY popularity DESC
    LIMIT 10
  `);
  
  const topRated = await db.all(`
    SELECT id, title, poster_path, release_date, vote_average
    FROM movies
    WHERE vote_average > 0
    ORDER BY vote_average DESC
    LIMIT 10
  `);
  
  const topActors = await db.all(`
    SELECT p.name, COUNT(*) as movie_count
    FROM movie_cast mc
    JOIN persons p ON mc.person_id = p.id
    GROUP BY p.id
    ORDER BY movie_count DESC
    LIMIT 10
  `);
  
  const topDirectors = await db.all(`
    SELECT p.name, COUNT(*) as movie_count
    FROM movie_crew mc
    JOIN persons p ON mc.person_id = p.id
    WHERE mc.job = 'Director'
    GROUP BY p.id
    ORDER BY movie_count DESC
    LIMIT 10
  `);
  
  const avgRuntime = await db.get(`
    SELECT AVG(runtime) as avg
    FROM movies
    WHERE runtime > 0
  `);
  
  return {
    total_movies: totalMovies.count,
    total_users: totalUsers.count,
    total_ratings: totalRatings.count,
    avg_rating: avgRating.avg || 0,
    year_distribution: yearDistribution,
    genre_distribution: genreDistribution,
    most_popular: mostPopular,
    top_rated: topRated,
    top_actors: topActors,
    top_directors: topDirectors,
    avg_runtime: avgRuntime.avg || 0,
    avg_runtime_formatted: `${Math.round(avgRuntime.avg || 0)} min`
  };
}


function formatDuration(minutes) {
  if (!minutes) return '0 minute';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  let result = '';
  
  if (hours > 0) {
    result += `${hours} ${hours === 1 ? 'oră' : 'ore'}`;
  }
  
  if (remainingMinutes > 0) {
    if (result) result += ' și ';
    result += `${remainingMinutes} ${remainingMinutes === 1 ? 'minut' : 'minute'}`;
  }
  
  return result;
}