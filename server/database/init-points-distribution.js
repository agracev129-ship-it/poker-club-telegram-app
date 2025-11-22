import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initPointsDistribution() {
  try {
    console.log('🎯 Initializing points distribution system...');
    
    const schemaPath = path.join(__dirname, 'schema-points-distribution.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await query(schema);
      console.log('✅ Points distribution system initialized successfully!');
    } else {
      console.warn('⚠️ schema-points-distribution.sql not found');
    }
  } catch (error) {
    console.error('❌ Error initializing points distribution system:', error);
    throw error;
  }
}

