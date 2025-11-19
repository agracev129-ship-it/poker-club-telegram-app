import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initTournamentLifecycle() {
  try {
    console.log('🎰 Initializing Simplified Tournament System...');
    
    // ВАЖНО: Сначала обновляем существующие записи с недопустимыми статусами
    // Это нужно сделать ДО применения constraint, чтобы избежать ошибок
    try {
      await query(`
        UPDATE games 
        SET tournament_status = CASE 
          WHEN tournament_status = 'finished' THEN 'completed'
          WHEN tournament_status IN ('registration_open', 'check_in', 'finalizing', 'seating') THEN 'upcoming'
          WHEN tournament_status = 'late_registration' THEN 'started'
          WHEN tournament_status = 'finishing' THEN 'completed'
          WHEN tournament_status = 'archived' THEN 'completed'
          WHEN tournament_status NOT IN ('upcoming', 'started', 'in_progress', 'completed', 'cancelled') THEN 'upcoming'
          ELSE tournament_status
        END
        WHERE tournament_status NOT IN ('upcoming', 'started', 'in_progress', 'completed', 'cancelled')
          OR tournament_status IS NULL;
      `);
      console.log('✅ Updated existing tournament statuses');
    } catch (updateError) {
      console.warn('⚠️ Warning updating tournament statuses (may not exist yet):', updateError.message);
    }
    
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

