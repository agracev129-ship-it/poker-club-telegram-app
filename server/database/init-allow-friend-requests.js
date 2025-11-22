import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initAllowFriendRequests() {
  try {
    console.log('🔒 Initializing allow_friend_requests setting...');
    
    const schemaPath = path.join(__dirname, 'schema-allow-friend-requests.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await query(schema);
      console.log('✅ allow_friend_requests setting initialized successfully!');
    } else {
      console.warn('⚠️ schema-allow-friend-requests.sql not found');
    }
  } catch (error) {
    console.error('❌ Error initializing allow_friend_requests setting:', error);
    throw error;
  }
}



