import { query } from '../database/db.js';

/**
 * Менеджер достижений
 * Проверяет и выдаёт достижения пользователям
 */

// Определения достижений
const ACHIEVEMENTS = {
  FIRST_STEPS: {
    name: 'Первые шаги',
    description: 'Сыграл первую игру',
    icon: 'spade',
    condition: (stats) => stats.games_played >= 1
  },
  ACTIVIST: {
    name: 'Активист',
    description: 'Сыграл 10 игр',
    icon: 'zap',
    condition: (stats) => stats.games_played >= 10
  },
  FIRST_WIN: {
    name: 'Первая победа',
    description: 'Победил в турнире',
    icon: 'trophy',
    condition: (stats) => stats.games_won >= 1
  },
  CHAMPION: {
    name: 'Чемпион',
    description: 'Победи в 5 турнирах',
    icon: 'medal',
    condition: (stats) => stats.games_won >= 5
  },
  LEGEND: {
    name: 'Легенда сезона',
    description: 'Попади в топ-3 сезона',
    icon: 'star',
    condition: (stats) => stats.current_rank !== null && stats.current_rank <= 3
  },
  VETERAN: {
    name: 'Ветеран',
    description: 'Сыграй 100 игр',
    icon: 'target',
    condition: (stats) => stats.games_played >= 100
  }
};

/**
 * Проверяет и выдаёт достижения пользователю
 * @param {number} userId - ID пользователя
 * @returns {Promise<Array>} - Массив новых достижений
 */
export async function checkAndGrantAchievements(userId) {
  try {
    console.log(`🏆 Checking achievements for user ${userId}`);
    
    // Получаем статистику пользователя
    const statsResult = await query(
      `SELECT us.*, u.id as user_id
       FROM user_stats us
       JOIN users u ON u.id = us.user_id
       WHERE us.user_id = $1`,
      [userId]
    );
    
    if (statsResult.rows.length === 0) {
      console.log(`⚠️ No stats found for user ${userId}`);
      return [];
    }
    
    const stats = statsResult.rows[0];
    console.log(`📊 User stats:`, {
      games_played: stats.games_played,
      games_won: stats.games_won,
      total_points: stats.total_points,
      current_rank: stats.current_rank
    });
    
    // Получаем уже полученные достижения
    const existingResult = await query(
      `SELECT a.name
       FROM user_achievements ua
       JOIN achievements a ON a.id = ua.achievement_id
       WHERE ua.user_id = $1`,
      [userId]
    );
    
    const existingAchievements = new Set(existingResult.rows.map(row => row.name));
    console.log(`✅ Existing achievements:`, Array.from(existingAchievements));
    
    // Проверяем каждое достижение
    const newAchievements = [];
    
    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
      // Пропускаем уже полученные
      if (existingAchievements.has(achievement.name)) {
        continue;
      }
      
      // Проверяем условие
      if (achievement.condition(stats)) {
        console.log(`🎯 New achievement unlocked: ${achievement.name}`);
        
        // Выдаём достижение
        try {
          await query(
            `INSERT INTO user_achievements (user_id, achievement_id)
             SELECT $1, id FROM achievements WHERE name = $2
             ON CONFLICT DO NOTHING`,
            [userId, achievement.name]
          );
          
          newAchievements.push(achievement);
        } catch (error) {
          console.error(`Error granting achievement ${achievement.name}:`, error);
        }
      }
    }
    
    if (newAchievements.length > 0) {
      console.log(`🎉 Granted ${newAchievements.length} new achievements to user ${userId}`);
    } else {
      console.log(`ℹ️ No new achievements for user ${userId}`);
    }
    
    return newAchievements;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

/**
 * Инициализирует таблицы достижений
 */
export async function initializeAchievements() {
  try {
    console.log('🏆 Initializing achievements system...');
    
    // Создаём таблицу достижений если не существует
    await query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        icon VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Создаём таблицу пользовательских достижений
    await query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_id)
      )
    `);
    
    // Добавляем индексы
    await query(`
      CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id 
      ON user_achievements(user_id)
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id 
      ON user_achievements(achievement_id)
    `);
    
    // Заполняем достижения
    for (const achievement of Object.values(ACHIEVEMENTS)) {
      await query(
        `INSERT INTO achievements (name, description, icon)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE 
         SET description = $2, icon = $3`,
        [achievement.name, achievement.description, achievement.icon]
      );
    }
    
    console.log('✅ Achievements system initialized');
  } catch (error) {
    console.error('Error initializing achievements:', error);
    throw error;
  }
}

export default {
  checkAndGrantAchievements,
  initializeAchievements
};

