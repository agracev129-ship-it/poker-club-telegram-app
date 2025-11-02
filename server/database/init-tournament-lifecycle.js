import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initTournamentLifecycle() {
  try {
    console.log('🎰 Initializing Simplified Tournament System...');
    
    // Сначала применяем полную схему (если еще не применена)
    const fullSchemaPath = path.join(__dirname, 'schema-tournament-lifecycle.sql');
    if (fs.existsSync(fullSchemaPath)) {
      const fullSchema = fs.readFileSync(fullSchemaPath, 'utf8');
      await query(fullSchema);
    }
    
    // Затем применяем упрощения
    const simplifiedSchemaPath = path.join(__dirname, 'schema-tournament-simplified.sql');
    const simplifiedSchema = fs.readFileSync(simplifiedSchemaPath, 'utf8');
    await query(simplifiedSchema);
    
    console.log('✅ Simplified Tournament System initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing tournament system:', error);
    throw error;
  }
}

