import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initProfileModeration() {
  const client = await pool.connect();
  try {
    console.log('Инициализация схемы модерации профилей...');
    
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema-profile-moderation.sql'),
      'utf-8'
    );
    
    await client.query(schemaSQL);
    console.log('✓ Схема модерации профилей успешно инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации схемы модерации профилей:', error);
    throw error;
  } finally {
    client.release();
  }
}

