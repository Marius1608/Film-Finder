// scripts/import_data.js
import { openDB, initializeDB } from '../lib/db';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

async function importMovies() {
  const db = await openDB();
  const moviesFile = path.join(process.cwd(), 'data/raw/ml-1m/movies.csv');
  
  console.log(`Importing movies from ${moviesFile}...`);
  
  const stream = fs.createReadStream(moviesFile)
    .pipe(csv());
  
  for await (const movie of stream) {
    const { movieId, title, genres } = movie;
    const year = title.match(/\((\d{4})\)/) ? title.match(/\((\d{4})\)/)[1] : null;
    
    await db.run(`
      INSERT INTO movies (id, title, year, genres) 
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        year = excluded.year,
        genres = excluded.genres
    `, movieId, title, year, genres);
  }
  
  console.log('Movies imported successfully!');
}

// Funcții similare pentru importul altor date (ratings, users, etc.)

async function main() {
  await initializeDB();
  await importMovies();
  // importul altor date
}

main().catch(console.error);