// lib/recommendations.js - Modul pentru algoritmii de recomandare
import { openDB } from './db';
import { getUserHistory } from './user';
import path from 'path';
import fs from 'fs/promises';


async function loadSimilarityMatrix() {
  const dataPath = path.resolve(process.cwd(), 'data/preprocessed/similarity_matrix.pkl');

  const db = await openDB();
  
  const matrixData = await db.get(
    'SELECT value FROM precomputed_data WHERE type = ? AND key = ?',
    'similarity_matrix', 'full'
  );
  
  if (matrixData) {
    return JSON.parse(matrixData.value);
  }
  
  return [];
}


async function getMovieIndex(movieId) {
  const db = await openDB();
  
  const indexMapping = await db.get(
    'SELECT value FROM precomputed_data WHERE type = ? AND key = ?',
    'movie_index_mapping', movieId.toString()
  );
  
  if (indexMapping) {
    return parseInt(indexMapping.value);
  }
  
  return -1; 
}


export async function getMovieSimilarity(movieId, limit = 10) {
  const db = await openDB();
  
  const movieIndex = await getMovieIndex(movieId);
  
  if (movieIndex === -1) {
    return [];
  }
  
  const similarityMatrix = await loadSimilarityMatrix();
  
  if (!similarityMatrix || !similarityMatrix[movieIndex]) {
    return [];
  }
  
  const similarities = similarityMatrix[movieIndex];
  
  const indexedSimilarities = similarities.map((sim, idx) => ({ idx, sim }));
  
  const sortedSimilarities = indexedSimilarities
    .filter(item => item.idx !== movieIndex)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, limit);
  
  const similarMovieIds = [];
  for (const { idx } of sortedSimilarities) {
    const mapping = await db.get(
      'SELECT key FROM precomputed_data WHERE type = ? AND value = ?',
      'movie_index_mapping', idx.toString()
    );
    
    if (mapping) {
      similarMovieIds.push(parseInt(mapping.key));
    }
  }
  
  const similarMovies = [];
  for (let i = 0; i < similarMovieIds.length; i++) {
    const movie = await db.get(
      'SELECT id, title, poster_path, release_date, vote_average FROM movies WHERE id = ?',
      similarMovieIds[i]
    );
    
    if (movie) {
      similarMovies.push({
        ...movie,
        similarity: sortedSimilarities[i].sim
      });
    }
  }
  
  return similarMovies;
}


async function getMovieFeatures(movieId) {
  const db = await openDB();
  
  const genres = await db.all(`
    SELECT g.name
    FROM genres g
    JOIN movie_genres mg ON g.id = mg.genre_id
    WHERE mg.movie_id = ?
  `, movieId);
  
  const allGenres = await db.all('SELECT name FROM genres ORDER BY name');
  
  const genreFeatures = allGenres.map(g => 
    genres.some(genre => genre.name === g.name) ? 1 : 0
  );
  
  return genreFeatures;
}


async function getUserProfile(userId) {
  const db = await openDB();
  
  const history = await db.all(`
    SELECT h.movie_id, h.rating
    FROM user_history h
    WHERE h.user_id = ?
  `, userId);
  
  if (history.length === 0) {
    const allGenres = await db.all('SELECT name FROM genres ORDER BY name');
    return new Array(allGenres.length).fill(0);
  }
  
  const allGenres = await db.all('SELECT name FROM genres ORDER BY name');
  
  const userProfile = new Array(allGenres.length).fill(0);
  
  for (const item of history) {
    
    const movieFeatures = await getMovieFeatures(item.movie_id);
    const weight = (item.rating - 5.5) / 10;
    for (let i = 0; i < userProfile.length; i++) {
      userProfile[i] += movieFeatures[i] * weight;
    }
  }
  
  const norm = Math.sqrt(userProfile.reduce((sum, val) => sum + val * val, 0));
  
  if (norm > 0) {
    for (let i = 0; i < userProfile.length; i++) {
      userProfile[i] /= norm;
    }
  }
  
  return userProfile;
}


export async function getContentBasedRecommendations(userId, limit = 20) {
  const db = await openDB();
  
  const userProfile = await getUserProfile(userId);
  
  const movies = await db.all(`
    SELECT id, title, poster_path, release_date, vote_average
    FROM movies
  `);
  
  const scoredMovies = [];
  
  for (const movie of movies) {
    const movieFeatures = await getMovieFeatures(movie.id);
    
    let similarity = 0;
    for (let i = 0; i < userProfile.length; i++) {
      similarity += userProfile[i] * movieFeatures[i];
    }
    
    scoredMovies.push({
      ...movie,
      score: similarity
    });
  }
  
  const watchedMovies = await db.all(`
    SELECT movie_id
    FROM user_history
    WHERE user_id = ?
  `, userId);
  
  const watchedMovieIds = new Set(watchedMovies.map(m => m.movie_id));
  
  const recommendations = scoredMovies
    .filter(movie => !watchedMovieIds.has(movie.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return recommendations;
}


export async function getCollaborativeFilteringRecommendations(userId, limit = 20, method = 'user') {
  const db = await openDB();
  
  const watchedMovies = await db.all(`
    SELECT movie_id, rating
    FROM user_history
    WHERE user_id = ?
  `, userId);
  
  if (watchedMovies.length === 0) {
    return getPopularMovies(limit);
  }
  
  const watchedMovieIds = new Set(watchedMovies.map(m => m.movie_id));
  
  if (method === 'user') {
    const similarUsers = await db.all(`
      SELECT u.id, COUNT(*) as common_movies,
             SUM(u.rating * w.rating) / (SQRT(SUM(u.rating * u.rating)) * SQRT(SUM(w.rating * w.rating))) as similarity
      FROM user_history u
      JOIN user_history w ON u.movie_id = w.movie_id
      WHERE w.user_id = ? AND u.user_id != ?
      GROUP BY u.user_id
      HAVING common_movies >= 3
      ORDER BY similarity DESC
      LIMIT 50
    `, userId, userId);
    
    if (similarUsers.length === 0) {
      return getPopularMovies(limit);
    }
    
    const recommendations = [];
    
    for (const similarUser of similarUsers) {
      const userMovies = await db.all(`
        SELECT h.movie_id, h.rating, m.title, m.poster_path, m.release_date, m.vote_average
        FROM user_history h
        JOIN movies m ON h.movie_id = m.id
        WHERE h.user_id = ? AND h.rating >= 7
          AND h.movie_id NOT IN (${Array.from(watchedMovieIds).join(',') || '0'})
        ORDER BY h.rating DESC
        LIMIT 10
      `, similarUser.id);
      
      for (const movie of userMovies) {
        recommendations.push({
          id: movie.movie_id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          score: movie.rating * similarUser.similarity
        });
        
        watchedMovieIds.add(movie.movie_id);
      }
    }
    
    const uniqueRecommendations = {};
    
    for (const rec of recommendations) {
      if (!uniqueRecommendations[rec.id] || uniqueRecommendations[rec.id].score < rec.score) {
        uniqueRecommendations[rec.id] = rec;
      }
    }
    
    return Object.values(uniqueRecommendations)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
  } else {
    const recommendations = [];
    
    for (const watched of watchedMovies) {
      const similarMovies = await getMovieSimilarity(watched.movie_id, 5);
      
      for (const movie of similarMovies) {
        if (!watchedMovieIds.has(movie.id)) {
          
          const score = movie.similarity * (watched.rating / 10);
          
          recommendations.push({
            ...movie,
            score
          });
          
          watchedMovieIds.add(movie.id);
        }
      }
    }
    
    const uniqueRecommendations = {};
    
    for (const rec of recommendations) {
      if (!uniqueRecommendations[rec.id] || uniqueRecommendations[rec.id].score < rec.score) {
        uniqueRecommendations[rec.id] = rec;
      }
    }
    
    return Object.values(uniqueRecommendations)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}


export async function getHybridRecommendations(userId, limit = 20, weights = {}) {
 
  const defaultWeights = {
    content: 0.4,
    collaborative_user: 0.3,
    collaborative_item: 0.3
  };
  
  const actualWeights = { ...defaultWeights, ...weights };
  
  const contentRecs = await getContentBasedRecommendations(userId, limit * 2);
  const userRecs = await getCollaborativeFilteringRecommendations(userId, limit * 2, 'user');
  const itemRecs = await getCollaborativeFilteringRecommendations(userId, limit * 2, 'item');
  
  function normalizeScores(recommendations) {
    const maxScore = Math.max(...recommendations.map(r => r.score));
    return recommendations.map(r => ({
      ...r,
      normalizedScore: maxScore > 0 ? r.score / maxScore : 0
    }));
  }
  
  const normalizedContentRecs = normalizeScores(contentRecs);
  const normalizedUserRecs = normalizeScores(userRecs);
  const normalizedItemRecs = normalizeScores(itemRecs);
  
  const allMovieIds = new Set([
    ...normalizedContentRecs.map(r => r.id),
    ...normalizedUserRecs.map(r => r.id),
    ...normalizedItemRecs.map(r => r.id)
  ]);
  
  const movieMap = {};
  
  for (const rec of normalizedContentRecs) {
    movieMap[rec.id] = rec;
    movieMap[rec.id].hybridScore = rec.normalizedScore * actualWeights.content;
  }
  
  for (const rec of normalizedUserRecs) {
    if (!movieMap[rec.id]) {
      movieMap[rec.id] = rec;
      movieMap[rec.id].hybridScore = 0;
    }
    movieMap[rec.id].hybridScore += rec.normalizedScore * actualWeights.collaborative_user;
  }
  
  for (const rec of normalizedItemRecs) {
    if (!movieMap[rec.id]) {
      movieMap[rec.id] = rec;
      movieMap[rec.id].hybridScore = 0;
    }
    movieMap[rec.id].hybridScore += rec.normalizedScore * actualWeights.collaborative_item;
  }
  
  return Object.values(movieMap)
    .sort((a, b) => b.hybridScore - a.hybridScore)
    .slice(0, limit)
    .map(r => ({
      id: r.id,
      title: r.title,
      poster_path: r.poster_path,
      release_date: r.release_date,
      vote_average: r.vote_average,
      score: r.hybridScore
    }));
}


export async function getPopularMovies(limit = 20) {
  const db = await openDB();
  
  const movies = await db.all(`
    SELECT id, title, poster_path, release_date, vote_average, popularity
    FROM movies
    ORDER BY popularity DESC
    LIMIT ?
  `, limit);
  
  return movies.map(movie => ({
    ...movie,
    score: movie.popularity / 100 
  }));
}


export async function getProfileRecommendations(profileName, limit = 20) {
  const db = await openDB();
  
  const profiles = {
    'action_fan': ['Action', 'Adventure', 'Sci-Fi'],
    'drama_lover': ['Drama', 'Romance'],
    'comedy_enthusiast': ['Comedy', 'Animation'],
    'thriller_addict': ['Thriller', 'Horror', 'Mystery'],
    'documentary_watcher': ['Documentary'],
    'family_viewer': ['Family', 'Children', 'Animation'],
    'classic_cinephile': ['Film-Noir', 'Classic', 'Western'],
    'international_fan': ['Foreign', 'Independent'],
    'musical_appreciator': ['Musical']
  };
  
  if (!profiles[profileName]) {
    return getPopularMovies(limit);
  }
  
  const genresList = profiles[profileName].map(g => `'${g}'`).join(',');
  
  const movies = await db.all(`
    SELECT m.id, m.title, m.poster_path, m.release_date, m.vote_average,
           m.popularity, COUNT(mg.genre_id) as genre_match
    FROM movies m
    JOIN movie_genres mg ON m.id = mg.movie_id
    JOIN genres g ON mg.genre_id = g.id
    WHERE g.name IN (${genresList})
    GROUP BY m.id
    ORDER BY genre_match DESC, m.vote_average DESC, m.popularity DESC
    LIMIT ?
  `, limit);
  
  return movies.map(movie => ({
    ...movie,
    score: (movie.genre_match / profiles[profileName].length) * 
           (movie.vote_average / 10)
  }));
}
