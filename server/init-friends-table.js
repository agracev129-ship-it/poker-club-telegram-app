import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import db from './database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function initFriendsTable() {
  console.log('🚀 Initializing friendships table...');

  try {
    // Read and execute schema
    const schemaPath = join(__dirname, 'database', 'schema-friends.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    await db.query(schema);
    console.log('✅ Friendships table created successfully');

    console.log('✅ Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initFriendsTable();

