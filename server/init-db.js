import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from './database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database initialization...');
    
    // Читаем и выполняем схему
    console.log('📝 Creating database schema...');
    const schemaSQL = readFileSync(join(__dirname, 'database', 'schema.sql'), 'utf-8');
    await client.query(schemaSQL);
    console.log('✅ Schema created successfully');
    
    // Читаем и выполняем начальные данные
    console.log('📝 Seeding initial data...');
    const seedSQL = readFileSync(join(__dirname, 'database', 'seed.sql'), 'utf-8');
    await client.query(seedSQL);
    console.log('✅ Initial data seeded successfully');
    
    console.log('🎉 Database initialization completed!');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Запускаем инициализацию
initDatabase().catch(console.error);

