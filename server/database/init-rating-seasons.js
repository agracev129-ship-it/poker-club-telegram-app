import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initRatingSeasons() {
  try {
    console.log('📊 Initializing rating seasons schema...');
    
    const schemaPath = path.join(__dirname, 'schema-rating-seasons.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    
    console.log('✅ Rating seasons schema initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing rating seasons schema:', error);
    throw error;
  }
}

