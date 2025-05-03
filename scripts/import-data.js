require('dotenv').config();
const path = require('path');
const { importData } = require('../lib/db');

async function main() {
  const dataPath = process.argv[2] || path.resolve(__dirname, '../data/preprocessed');
  
  console.log(`Importare date din ${dataPath}...`);
  
  try {
    await importData(dataPath);
    console.log('Datele au fost importate cu succes!');
  } catch (error) {
    console.error('Eroare la importul datelor:', error);
    process.exit(1);
  }
}

main();