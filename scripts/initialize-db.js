require('dotenv').config();
const { initializeDB } = require('../lib/db');

async function main() {
  console.log('Inițializare bază de date...');
  
  try {
    await initializeDB();
    console.log('Baza de date a fost inițializată cu succes!');
  } catch (error) {
    console.error('Eroare la inițializarea bazei de date:', error);
    process.exit(1);
  }
}

main();
