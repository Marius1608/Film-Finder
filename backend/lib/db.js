import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'data/db.sqlite');

export async function openDB() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}


export async function initializeDB() {
  const db = await openDB();
  
  await db.exec('BEGIN TRANSACTION');
  
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id INTEGER PRIMARY KEY,
        display_name TEXT,
        bio TEXT,
        avatar_url TEXT,
        favorite_genre TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        year INTEGER,
        poster_path TEXT,
        overview TEXT,
        runtime INTEGER,
        vote_average REAL,
        popularity REAL,
        release_date TEXT
      )
    `);
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS genres (
        id INTEGER PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
      )
    `);
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS movie_genres (
        movie_id INTEGER,
        genre_id INTEGER,
        PRIMARY KEY (movie_id, genre_id),
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
        FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
      )
    `);
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS persons (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        profile_path TEXT
      )
    `);
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS movie_cast (
        movie_id INTEGER,
        person_id INTEGER,
        character TEXT,
        order_number INTEGER,
        PRIMARY KEY (movie_id, person_id),
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
        FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
      )
    `);
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS movie_crew (
        movie_id INTEGER,
        person_id INTEGER,
        job TEXT,
        department TEXT,
        PRIMARY KEY (movie_id, person_id, job),
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
        FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
      )
    `);
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        movie_id INTEGER,
        watched_date TEXT NOT NULL,
        rating INTEGER CHECK (rating BETWEEN 1 AND 10),
        notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
        UNIQUE(user_id, movie_id)
      )
    `);
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        is_public INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS list_movies (
        list_id INTEGER,
        movie_id INTEGER,
        added_date TEXT NOT NULL,
        PRIMARY KEY (list_id, movie_id),
        FOREIGN KEY (list_id) REFERENCES user_lists(id) ON DELETE CASCADE,
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
      )
    `);
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        api_key TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS precomputed_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(type, key)
      )
    `);
    
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
      CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year);
      CREATE INDEX IF NOT EXISTS idx_movies_popularity ON movies(popularity);
      CREATE INDEX IF NOT EXISTS idx_movie_genres_movie_id ON movie_genres(movie_id);
      CREATE INDEX IF NOT EXISTS idx_movie_genres_genre_id ON movie_genres(genre_id);
      CREATE INDEX IF NOT EXISTS idx_user_history_user_id ON user_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_history_movie_id ON user_history(movie_id);
      CREATE INDEX IF NOT EXISTS idx_user_lists_user_id ON user_lists(user_id);
      CREATE INDEX IF NOT EXISTS idx_list_movies_list_id ON list_movies(list_id);
      CREATE INDEX IF NOT EXISTS idx_list_movies_movie_id ON list_movies(movie_id);
    `);
    
    await db.exec('COMMIT');
    console.log('Baza de date a fost inițializată cu succes!');
    
  } catch (error) {
    await db.exec('ROLLBACK');
    console.error('Eroare la inițializarea bazei de date:', error);
    throw error;
  }
}

export async function importData(dataPath) {
  const db = await openDB();
  
  await db.exec('BEGIN TRANSACTION');
  
  try {
    await db.exec('COMMIT');
    console.log('Datele au fost importate cu succes!');
    
  } catch (error) {
    await db.exec('ROLLBACK');
    console.error('Eroare la importul datelor:', error);
    throw error;
  }
}