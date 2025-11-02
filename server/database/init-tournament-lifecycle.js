import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initTournamentLifecycle() {
  try {
    console.log('🎰 Initializing Tournament Lifecycle System...');
    
    const schemaPath = path.join(__dirname, 'schema-tournament-lifecycle.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await query(schema);
    
    console.log('✅ Tournament Lifecycle System initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing tournament lifecycle:', error);
    throw error;
  }
}

