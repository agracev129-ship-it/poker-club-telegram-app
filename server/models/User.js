import { query } from '../database/db.js';

export const User = {
  /**
   * Находит пользователя по Telegram ID
   */
  async findByTelegramId(telegramId) {
    const result = await query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );
    return result.rows[0];
  },

  /**
   * Создает нового пользователя или обновляет существующего
   */
  async upsert(userData) {
    const { telegram_id, username, first_name, last_name, photo_url } = userData;
    
    const result = await query(
      `INSERT INTO users (telegram_id, username, first_name, last_name, photo_url, last_active)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (telegram_id) 
       DO UPDATE SET 
         username = EXCLUDED.username,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         photo_url = EXCLUDED.photo_url,
         last_active = CURRENT_TIMESTAMP
       RETURNING *`,
      [telegram_id, username, first_name, last_name, photo_url]
    );
    
    const user = result.rows[0];
    
    // Создаем запись статистики если её нет
    await query(
      `INSERT INTO user_stats (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id]
    );
    
    // Даем достижение "Новичок"
    await query(
      `INSERT INTO user_achievements (user_id, achievement_id)
       SELECT $1, id FROM achievements WHERE name = 'Новичок'
       ON CONFLICT DO NOTHING`,
      [user.id]
    );
    
    return user;
  },

  /**
   * Получает статистику пользователя
   */
  async getStats(userId) {
    const result = await query(
      `SELECT us.*, u.username, u.first_name, u.last_name, u.photo_url
       FROM user_stats us
       JOIN users u ON u.id = us.user_id
       WHERE us.user_id = $1`,
      [userId]
    );
    return result.rows[0];
  },

  /**
   * Получает полную информацию о пользователе
   */
  async getFullProfile(userId) {
    // Основная информация и статистика
    const userResult = await query(
      `SELECT u.*, us.games_played, us.games_won, us.total_points, 
              us.total_winnings, us.current_rank
       FROM users u
       LEFT JOIN user_stats us ON us.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return null;
    }
    
    const user = userResult.rows[0];
    
    // Достижения
    const achievementsResult = await query(
      `SELECT a.*, ua.earned_at
       FROM user_achievements ua
       JOIN achievements a ON a.id = ua.achievement_id
       WHERE ua.user_id = $1
       ORDER BY ua.earned_at DESC`,
      [userId]
    );
    
    // Последние активности
    const activitiesResult = await query(
      `SELECT * FROM user_activities
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );
    
    return {
      ...user,
      achievements: achievementsResult.rows,
      activities: activitiesResult.rows
    };
  },

  /**
   * Обновляет статистику пользователя
   */
  async updateStats(userId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
    
    values.push(userId);
    
    const result = await query(
      `UPDATE user_stats SET ${fields.join(', ')}
       WHERE user_id = $${paramCount}
       RETURNING *`,
      values
    );
    
    return result.rows[0];
  },

  /**
   * Получает рейтинг пользователей
   */
  async getLeaderboard(limit = 50) {
    const result = await query(
      `SELECT u.id, u.telegram_id, u.username, u.first_name, u.last_name, 
              u.photo_url, us.games_played, us.games_won, us.total_points,
              us.total_winnings, us.current_rank,
              ROW_NUMBER() OVER (ORDER BY us.total_points DESC NULLS LAST) as rank
       FROM users u
       LEFT JOIN user_stats us ON us.user_id = u.id
       ORDER BY COALESCE(us.total_points, 0) DESC, u.created_at ASC
       LIMIT $1`,
      [limit]
    );
    
    return result.rows;
  },

  /**
   * Обновляет рейтинги всех пользователей
   */
  async updateRankings() {
    await query(
      `UPDATE user_stats us
       SET current_rank = ranked.rank
       FROM (
         SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank
         FROM user_stats
         WHERE games_played > 0
       ) ranked
       WHERE us.user_id = ranked.user_id`
    );
  },

  /**
   * Получает всех пользователей (для админки)
   */
  async getAll(limit = 100, offset = 0) {
    const result = await query(
      `SELECT u.*, us.games_played, us.games_won, us.total_points, 
              us.total_winnings, us.current_rank
       FROM users u
       LEFT JOIN user_stats us ON us.user_id = u.id
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    return result.rows;
  },

  /**
   * Поиск пользователей по имени
   */
  async search(searchTerm, limit = 50) {
    const searchPattern = `%${searchTerm}%`;
    const result = await query(
      `SELECT u.*, us.games_played, us.games_won, us.total_points, 
              us.total_winnings, us.current_rank
       FROM users u
       LEFT JOIN user_stats us ON us.user_id = u.id
       WHERE LOWER(u.username) LIKE LOWER($1)
          OR LOWER(u.first_name) LIKE LOWER($1)
          OR LOWER(u.last_name) LIKE LOWER($1)
       ORDER BY u.created_at DESC
       LIMIT $2`,
      [searchPattern, limit]
    );
    
    return result.rows;
  },

  /**
   * Блокирует пользователя
   */
  async block(userId) {
    const result = await query(
      `UPDATE users 
       SET is_blocked = TRUE 
       WHERE id = $1
       RETURNING *`,
      [userId]
    );
    
    return result.rows[0];
  },

  /**
   * Разблокирует пользователя
   */
  async unblock(userId) {
    const result = await query(
      `UPDATE users 
       SET is_blocked = FALSE 
       WHERE id = $1
       RETURNING *`,
      [userId]
    );
    
    return result.rows[0];
  },

  /**
   * Проверяет заблокирован ли пользователь
   */
  async isBlocked(userId) {
    const result = await query(
      'SELECT is_blocked FROM users WHERE id = $1',
      [userId]
    );
    
    return result.rows[0]?.is_blocked || false;
  },

  /**
   * Проверяет заблокирован ли пользователь по Telegram ID
   */
  async isBlockedByTelegramId(telegramId) {
    const result = await query(
      'SELECT is_blocked FROM users WHERE telegram_id = $1',
      [telegramId]
    );
    
    return result.rows[0]?.is_blocked || false;
  }
};

