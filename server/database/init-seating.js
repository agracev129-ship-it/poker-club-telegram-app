// Migration script to create table_assignments table
import { query } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initSeating() {
  try {
    console.log('🔧 Running seating tables migration...');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'schema-seating.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute SQL
    await query(sql);
    
    console.log('✅ Table assignments schema created successfully!');
  } catch (error) {
    console.error('❌ Error creating seating tables:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initSeating()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { initSeating };






