// scripts/seed-db.js
require('dotenv').config();
const { openDB } = require('../lib/db');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

/**
 * Importă date mocate în baza de date
 */
async function seedDatabase() {
  console.log('Introducere date mocate în baza de date...');
  
  const db = await openDB();
  
  // Rulăm totul în cadrul unei tranzacții
  await db.exec('BEGIN TRANSACTION');
  
  try {
    // Adăugăm genuri
    console.log('Adăugare genuri...');
    const genres = [
      { id: 28, name: 'Action' },
      { id: 12, name: 'Adventure' },
      { id: 16, name: 'Animation' },
      { id: 35, name: 'Comedy' },
      { id: 80, name: 'Crime' },
      { id: 99, name: 'Documentary' },
      { id: 18, name: 'Drama' },
      { id: 10751, name: 'Family' },
      { id: 14, name: 'Fantasy' },
      { id: 36, name: 'History' },
      { id: 27, name: 'Horror' },
      { id: 10402, name: 'Music' },
      { id: 9648, name: 'Mystery' },
      { id: 10749, name: 'Romance' },
      { id: 878, name: 'Science Fiction' },
      { id: 10770, name: 'TV Movie' },
      { id: 53, name: 'Thriller' },
      { id: 10752, name: 'War' },
      { id: 37, name: 'Western' }
    ];
    
    for (const genre of genres) {
      await db.run(
        'INSERT OR IGNORE INTO genres (id, name) VALUES (?, ?)',
        genre.id, genre.name
      );
    }
    
    // Adăugăm câteva filme mocate
    console.log('Adăugare filme...');
    const movies = [
      {
        id: 1,
        title: 'The Shawshank Redemption',
        year: 1994,
        poster_path: 'https://placehold.co/300x450?text=Shawshank+Redemption',
        overview: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
        runtime: 142,
        vote_average: 8.7,
        popularity: 87.2,
        release_date: '1994-09-23',
        genres: [18, 80] // Drama, Crime
      },
      {
        id: 2,
        title: 'The Godfather',
        year: 1972,
        poster_path: 'https://placehold.co/300x450?text=The+Godfather',
        overview: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
        runtime: 175,
        vote_average: 8.7,
        popularity: 75.6,
        release_date: '1972-03-24',
        genres: [18, 80] // Drama, Crime
      },
      {
        id: 3,
        title: 'The Dark Knight',
        year: 2008,
        poster_path: 'https://placehold.co/300x450?text=The+Dark+Knight',
        overview: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        runtime: 152,
        vote_average: 8.5,
        popularity: 92.3,
        release_date: '2008-07-18',
        genres: [28, 80, 18] // Action, Crime, Drama
      },
      {
        id: 4,
        title: 'Pulp Fiction',
        year: 1994,
        poster_path: 'https://placehold.co/300x450?text=Pulp+Fiction',
        overview: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
        runtime: 154,
        vote_average: 8.5,
        popularity: 68.9,
        release_date: '1994-10-14',
        genres: [53, 80] // Thriller, Crime
      },
      {
        id: 5,
        title: 'Fight Club',
        year: 1999,
        poster_path: 'https://placehold.co/300x450?text=Fight+Club',
        overview: 'An insomniac office worker and a devil-may-care soapmaker form an underground fight club that evolves into something much, much more.',
        runtime: 139,
        vote_average: 8.4,
        popularity: 65.2,
        release_date: '1999-10-15',
        genres: [18] // Drama
      },
      {
        id: 6,
        title: 'Inception',
        year: 2010,
        poster_path: 'https://placehold.co/300x450?text=Inception',
        overview: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
        runtime: 148,
        vote_average: 8.3,
        popularity: 86.7,
        release_date: '2010-07-16',
        genres: [28, 878, 12] // Action, Science Fiction, Adventure
      },
      {
        id: 7,
        title: 'The Matrix',
        year: 1999,
        poster_path: 'https://placehold.co/300x450?text=The+Matrix',
        overview: 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
        runtime: 136,
        vote_average: 8.2,
        popularity: 73.4,
        release_date: '1999-03-31',
        genres: [28, 878] // Action, Science Fiction
      },
      {
        id: 8,
        title: 'Parasite',
        year: 2019,
        poster_path: 'https://placehold.co/300x450?text=Parasite',
        overview: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
        runtime: 132,
        vote_average: 8.5,
        popularity: 88.0,
        release_date: '2019-05-30',
        genres: [35, 53, 18] // Comedy, Thriller, Drama
      },
      {
        id: 9,
        title: 'Interstellar',
        year: 2014,
        poster_path: 'https://placehold.co/300x450?text=Interstellar',
        overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
        runtime: 169,
        vote_average: 8.4,
        popularity: 85.3,
        release_date: '2014-11-07',
        genres: [12, 18, 878] // Adventure, Drama, Science Fiction
      },
      {
        id: 10,
        title: 'The Lion King',
        year: 1994,
        poster_path: 'https://placehold.co/300x450?text=The+Lion+King',
        overview: 'Lion prince Simba and his father are targeted by his bitter uncle, who wants to ascend the throne himself.',
        runtime: 88,
        vote_average: 8.3,
        popularity: 79.1,
        release_date: '1994-06-24',
        genres: [16, 10751, 18] // Animation, Family, Drama
      }
    ];
    
    for (const movie of movies) {
      await db.run(
        `INSERT OR IGNORE INTO movies 
         (id, title, year, poster_path, overview, runtime, vote_average, popularity, release_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        movie.id, movie.title, movie.year, movie.poster_path, movie.overview,
        movie.runtime, movie.vote_average, movie.popularity, movie.release_date
      );
      
      // Adăugăm relațiile film-gen
      for (const genreId of movie.genres) {
        await db.run(
          'INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?, ?)',
          movie.id, genreId
        );
      }
    }
    
    // Adăugăm câteva persoane (actori, regizori)
    console.log('Adăugare persoane...');
    const persons = [
      { id: 1, name: 'Morgan Freeman', profile_path: 'https://placehold.co/200x300?text=Morgan+Freeman' },
      { id: 2, name: 'Tim Robbins', profile_path: 'https://placehold.co/200x300?text=Tim+Robbins' },
      { id: 3, name: 'Marlon Brando', profile_path: 'https://placehold.co/200x300?text=Marlon+Brando' },
      { id: 4, name: 'Al Pacino', profile_path: 'https://placehold.co/200x300?text=Al+Pacino' },
      { id: 5, name: 'Christian Bale', profile_path: 'https://placehold.co/200x300?text=Christian+Bale' },
      { id: 6, name: 'Heath Ledger', profile_path: 'https://placehold.co/200x300?text=Heath+Ledger' },
      { id: 7, name: 'John Travolta', profile_path: 'https://placehold.co/200x300?text=John+Travolta' },
      { id: 8, name: 'Samuel L. Jackson', profile_path: 'https://placehold.co/200x300?text=Samuel+L+Jackson' },
      { id: 9, name: 'Brad Pitt', profile_path: 'https://placehold.co/200x300?text=Brad+Pitt' },
      { id: 10, name: 'Edward Norton', profile_path: 'https://placehold.co/200x300?text=Edward+Norton' },
      { id: 11, name: 'Leonardo DiCaprio', profile_path: 'https://placehold.co/200x300?text=Leonardo+DiCaprio' },
      { id: 12, name: 'Joseph Gordon-Levitt', profile_path: 'https://placehold.co/200x300?text=Joseph+Gordon+Levitt' },
      { id: 13, name: 'Keanu Reeves', profile_path: 'https://placehold.co/200x300?text=Keanu+Reeves' },
      { id: 14, name: 'Laurence Fishburne', profile_path: 'https://placehold.co/200x300?text=Laurence+Fishburne' },
      { id: 15, name: 'Song Kang-ho', profile_path: 'https://placehold.co/200x300?text=Song+Kang+ho' },
      { id: 16, name: 'Matthew McConaughey', profile_path: 'https://placehold.co/200x300?text=Matthew+McConaughey' },
      { id: 17, name: 'Anne Hathaway', profile_path: 'https://placehold.co/200x300?text=Anne+Hathaway' },
      { id: 18, name: 'Frank Oz', profile_path: 'https://placehold.co/200x300?text=Frank+Oz' },
      { id: 19, name: 'Francis Ford Coppola', profile_path: 'https://placehold.co/200x300?text=Francis+Ford+Coppola' },
      { id: 20, name: 'Christopher Nolan', profile_path: 'https://placehold.co/200x300?text=Christopher+Nolan' },
      { id: 21, name: 'Quentin Tarantino', profile_path: 'https://placehold.co/200x300?text=Quentin+Tarantino' },
      { id: 22, name: 'David Fincher', profile_path: 'https://placehold.co/200x300?text=David+Fincher' },
      { id: 23, name: 'Lana Wachowski', profile_path: 'https://placehold.co/200x300?text=Lana+Wachowski' },
      { id: 24, name: 'Lilly Wachowski', profile_path: 'https://placehold.co/200x300?text=Lilly+Wachowski' },
      { id: 25, name: 'Bong Joon-ho', profile_path: 'https://placehold.co/200x300?text=Bong+Joon+ho' },
      { id: 26, name: 'Roger Allers', profile_path: 'https://placehold.co/200x300?text=Roger+Allers' }
    ];
    
    for (const person of persons) {
      await db.run(
        'INSERT OR IGNORE INTO persons (id, name, profile_path) VALUES (?, ?, ?)',
        person.id, person.name, person.profile_path
      );
    }
    
    // Adăugăm relații film-distribuție
    console.log('Adăugare distribuție...');
    const movieCast = [
      { movie_id: 1, person_id: 1, character: 'Ellis Boyd', order_number: 2 },
      { movie_id: 1, person_id: 2, character: 'Andy Dufresne', order_number: 1 },
      { movie_id: 2, person_id: 3, character: 'Don Vito Corleone', order_number: 1 },
      { movie_id: 2, person_id: 4, character: 'Michael Corleone', order_number: 2 },
      { movie_id: 3, person_id: 5, character: 'Bruce Wayne', order_number: 1 },
      { movie_id: 3, person_id: 6, character: 'Joker', order_number: 2 },
      { movie_id: 4, person_id: 7, character: 'Vincent Vega', order_number: 1 },
      { movie_id: 4, person_id: 8, character: 'Jules Winnfield', order_number: 2 },
      { movie_id: 5, person_id: 9, character: 'Tyler Durden', order_number: 1 },
      { movie_id: 5, person_id: 10, character: 'Narrator', order_number: 2 },
      { movie_id: 6, person_id: 11, character: 'Cobb', order_number: 1 },
      { movie_id: 6, person_id: 12, character: 'Arthur', order_number: 2 },
      { movie_id: 7, person_id: 13, character: 'Neo', order_number: 1 },
      { movie_id: 7, person_id: 14, character: 'Morpheus', order_number: 2 },
      { movie_id: 8, person_id: 15, character: 'Kim Ki-taek', order_number: 1 },
      { movie_id: 9, person_id: 16, character: 'Cooper', order_number: 1 },
      { movie_id: 9, person_id: 17, character: 'Brand', order_number: 2 }
    ];
    
    for (const cast of movieCast) {
      await db.run(
        'INSERT OR IGNORE INTO movie_cast (movie_id, person_id, character, order_number) VALUES (?, ?, ?, ?)',
        cast.movie_id, cast.person_id, cast.character, cast.order_number
      );
    }
    
    // Adăugăm relații film-echipă
    console.log('Adăugare echipă producție...');
    const movieCrew = [
      { movie_id: 2, person_id: 19, job: 'Director', department: 'Directing' },
      { movie_id: 3, person_id: 20, job: 'Director', department: 'Directing' },
      { movie_id: 4, person_id: 21, job: 'Director', department: 'Directing' },
      { movie_id: 4, person_id: 21, job: 'Writer', department: 'Writing' },
      { movie_id: 5, person_id: 22, job: 'Director', department: 'Directing' },
      { movie_id: 6, person_id: 20, job: 'Director', department: 'Directing' },
      { movie_id: 6, person_id: 20, job: 'Writer', department: 'Writing' },
      { movie_id: 7, person_id: 23, job: 'Director', department: 'Directing' },
      { movie_id: 7, person_id: 24, job: 'Director', department: 'Directing' },
      { movie_id: 8, person_id: 25, job: 'Director', department: 'Directing' },
      { movie_id: 9, person_id: 20, job: 'Director', department: 'Directing' },
      { movie_id: 10, person_id: 26, job: 'Director', department: 'Directing' }
    ];
    
    for (const crew of movieCrew) {
      await db.run(
        'INSERT OR IGNORE INTO movie_crew (movie_id, person_id, job, department) VALUES (?, ?, ?, ?)',
        crew.movie_id, crew.person_id, crew.job, crew.department
      );
    }
    
    // Adăugăm utilizatori mocați
    console.log('Adăugare utilizatori...');
    const users = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        display_name: 'Administrator',
        bio: 'Administrator al platformei FilmFinder',
        avatar_url: 'https://placehold.co/200x200?text=Admin',
        favorite_genre: 'Science Fiction'
      },
      {
        username: 'user1',
        email: 'user1@example.com',
        password: 'password123',
        display_name: 'Cinefil Pasionat',
        bio: 'Pasionat de filme clasice și noi, mereu în căutare de recomandări bune.',
        avatar_url: 'https://placehold.co/200x200?text=User1',
        favorite_genre: 'Drama'
      },
      {
        username: 'user2',
        email: 'user2@example.com',
        password: 'password123',
        display_name: 'Film Buff',
        bio: 'Colecționar de filme și critic amator.',
        avatar_url: 'https://placehold.co/200x200?text=User2',
        favorite_genre: 'Action'
      }
    ];
    
    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      const now = new Date().toISOString();
      
      // Adăugăm utilizatorul
      const result = await db.run(
        `INSERT OR IGNORE INTO users 
         (username, email, password_hash, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?)`,
        user.username, user.email, passwordHash, now, now
      );
      
      const userId = result.lastID || await db.get('SELECT id FROM users WHERE username = ?', user.username).then(row => row.id);
      
      // Adăugăm profilul utilizatorului
      await db.run(
        `INSERT OR IGNORE INTO user_profiles 
         (user_id, display_name, bio, avatar_url, favorite_genre) 
         VALUES (?, ?, ?, ?, ?)`,
        userId, user.display_name, user.bio, user.avatar_url, user.favorite_genre
      );
    }
    
    // Adăugăm istoric de vizionare pentru utilizatori
    console.log('Adăugare istoric vizionare...');
    const userHistory = [
      { user_id: 1, movie_id: 1, watched_date: '2023-01-15T18:30:00.000Z', rating: 9, notes: 'Un film clasic excelent!' },
      { user_id: 1, movie_id: 3, watched_date: '2023-02-20T20:15:00.000Z', rating: 10, notes: 'Performanță extraordinară a lui Heath Ledger' },
      { user_id: 1, movie_id: 6, watched_date: '2023-03-05T19:45:00.000Z', rating: 8, notes: 'Concept interesant și efecte vizuale impresionante' },
      { user_id: 1, movie_id: 8, watched_date: '2023-04-12T21:00:00.000Z', rating: 9, notes: 'O satiră socială excelentă' },
      
      { user_id: 2, movie_id: 2, watched_date: '2023-01-10T19:00:00.000Z', rating: 10, notes: 'Unul dintre cele mai bune filme din toate timpurile' },
      { user_id: 2, movie_id: 4, watched_date: '2023-02-05T20:30:00.000Z', rating: 9, notes: 'Dialoguri geniale și structură narativă inovatoare' },
      { user_id: 2, movie_id: 5, watched_date: '2023-03-15T18:45:00.000Z', rating: 8, notes: 'Un film care te pune pe gânduri' },
      { user_id: 2, movie_id: 7, watched_date: '2023-04-02T21:15:00.000Z', rating: 10, notes: 'Revoluționar pentru epoca sa' },
      
      { user_id: 3, movie_id: 1, watched_date: '2023-01-20T20:00:00.000Z', rating: 8, notes: 'O poveste emoționantă despre prietenie și speranță' },
      { user_id: 3, movie_id: 9, watched_date: '2023-02-10T19:30:00.000Z', rating: 9, notes: 'Vizual impresionant și emoționant' },
      { user_id: 3, movie_id: 10, watched_date: '2023-03-01T17:00:00.000Z', rating: 8, notes: 'Un clasic Disney cu muzică excepțională' },
      { user_id: 3, movie_id: 6, watched_date: '2023-04-20T21:30:00.000Z', rating: 10, notes: 'Unul dintre cele mai bune filme ale lui Nolan' }
    ];
    
    for (const history of userHistory) {
      await db.run(
        `INSERT OR IGNORE INTO user_history 
         (user_id, movie_id, watched_date, rating, notes) 
         VALUES (?, ?, ?, ?, ?)`,
        history.user_id, history.movie_id, history.watched_date, history.rating, history.notes
      );
    }
    
    // Adăugăm liste personalizate pentru utilizatori
    console.log('Adăugare liste personalizate...');
    const userLists = [
      { user_id: 1, name: 'Favorite All Time', description: 'Filmele mele preferate din toate timpurile', is_public: 1 },
      { user_id: 1, name: 'To Watch', description: 'Filme pe care vreau să le văd', is_public: 1 },
      { user_id: 2, name: 'Classics', description: 'Cele mai bune filme clasice', is_public: 1 },
      { user_id: 2, name: 'SciFi Collection', description: 'Colecția mea de filme SF', is_public: 0 },
      { user_id: 3, name: 'Family Movies', description: 'Filme bune pentru toată familia', is_public: 1 },
      { user_id: 3, name: 'Watch Later', description: 'Lista mea de filme de urmărit', is_public: 0 }
    ];
    
    for (const list of userLists) {
      const now = new Date().toISOString();
      
      const result = await db.run(
        `INSERT INTO user_lists 
         (user_id, name, description, is_public, created_at) 
         VALUES (?, ?, ?, ?, ?)`,
        list.user_id, list.name, list.description, list.is_public, now
      );
      
      const listId = result.lastID;
      
      // Adăugăm filme în liste
      if (list.user_id === 1 && list.name === 'Favorite All Time') {
        await db.run('INSERT INTO list_movies (list_id, movie_id, added_date) VALUES (?, ?, ?)', 
                    listId, 1, now);
        await db.run('INSERT INTO list_movies (list_id, movie_id, added_date) VALUES (?, ?, ?)', 
                    listId, 3, now);
        await db.run('INSERT INTO list_movies (list_id, movie_id, added_date) VALUES (?, ?, ?)', 
                    listId, 6, now);
      } else if (list.user_id === 1 && list.name === 'To Watch') {
        await db.run('INSERT INTO list_movies (list_id, movie_id, added_date) VALUES (?, ?, ?)', 
                    listId, 5, now);
        await db.run('INSERT INTO list_movies (list_id, movie_id, added_date) VALUES (?, ?, ?)', 
                    listId, 9, now);
      } else if (list.user_id === 2 && list.name === 'Classics') {
        await db.run('INSERT INTO list_movies (list_id, movie_id, added_date) VALUES (?, ?, ?)', 
                    listId, 1, now);
        await db.run('INSERT INTO list_movies (list_id, movie_id, added_date) VALUES (?, ?, ?)', 
                    listId, 2, now);
        await db.run('INSERT INTO list_movies (list_id, movie_id, added_date) VALUES (?, ?, ?)', 
                    listId, 4, now);
      } else if (list.user_id === 2 && list.name === 'SciFi Collection') {
        await db.run('INSERT INTO list_movies (list_id, movie_id, added_date) VALUES (?, ?, ?)', 
                    listId, 6, now);
        await db.run('INSERT INTO list_movies (list_id, movie_id, added_date) VALUES (?, ?, ?)', 
                    listId, 7, now);
        await db.run('INSERT INTO list_movies (list_id, movie_id, added_date) VALUES (?, ?, ?)', 
                    listId, 9, now);
      } else if (list.user_id === 3 && list.name === 'Family Movies') {
        await db.run('INSERT INTO list_movies (list_id, movie_id, added_date) VALUES (?, ?, ?)', 
                    listId, 10, now);
      } else if (list.user_id === 3 && list.name === 'Watch Later') {
        await db.run('INSERT INTO list_movies (list_id, movie_id, added_date) VALUES (?, ?, ?)', 
                    listId, 3, now);
        await db.run('INSERT INTO list_movies (list_id, movie_id, added_date) VALUES (?, ?, ?)', 
                    listId, 8, now);
      }
    }
    
    // Adăugăm date pre-calculate pentru similaritatea filmelor
    console.log('Adăugare date pre-calculate...');
    
    // Matrice simplificată de similaritate (exemplu)
    for (let i = 1; i <= 10; i++) {
      for (let j = 1; j <= 10; j++) {
        if (i !== j) {
          // Calculăm o similaritate simplă bazată pe genuri comune
          const movie1Genres = movies.find(m => m.id === i)?.genres || [];
          const movie2Genres = movies.find(m => m.id === j)?.genres || [];
          
          const commonGenres = movie1Genres.filter(g => movie2Genres.includes(g));
          const similarity = commonGenres.length / 
                          Math.sqrt(movie1Genres.length * movie2Genres.length);
          
          await db.run(
            `INSERT OR IGNORE INTO precomputed_data 
             (type, key, value, created_at) 
             VALUES (?, ?, ?, ?)`,
            'movie_similarity', `${i}_${j}`, similarity.toString(), new Date().toISOString()
          );
        }
      }
    }
    
    // Mapare index pentru filme
    for (let i = 1; i <= 10; i++) {
      await db.run(
        `INSERT OR IGNORE INTO precomputed_data 
         (type, key, value, created_at) 
         VALUES (?, ?, ?, ?)`,
        'movie_index_mapping', i.toString(), (i-1).toString(), new Date().toISOString()
      );
    }
    
    await db.exec('COMMIT');
    console.log('Date mocate adăugate cu succes în baza de date!');
    
  } catch (error) {
    await db.exec('ROLLBACK');
    console.error('Eroare la adăugarea datelor mocate:', error);
    throw error;
  }
}

// Rulăm funcția de introducere date
async function main() {
  try {
    await seedDatabase();
  } catch (error) {
    console.error('Eroare la rularea seed-ului:', error);
    process.exit(1);
  }
}

main();