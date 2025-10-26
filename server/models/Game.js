import { query } from '../database/db.js';

export const Game = {
  /**
   * Получает все игры
   */
  async getAll(filters = {}) {
    let sql = `
      SELECT g.*,
             COUNT(DISTINCT gr.user_id) as registered_count,
             u.username as creator_username
      FROM games g
      LEFT JOIN game_registrations gr ON g.id = gr.game_id AND gr.status = 'registered'
      LEFT JOIN users u ON g.created_by = u.id
    `;
    
    const conditions = [];
    const params = [];
    let paramCount = 1;
    
    if (filters.status) {
      conditions.push(`g.status = $${paramCount}`);
      params.push(filters.status);
      paramCount++;
    }
    
    if (filters.fromDate) {
      conditions.push(`g.date >= $${paramCount}`);
      params.push(filters.fromDate);
      paramCount++;
    }
    
    if (filters.toDate) {
      conditions.push(`g.date <= $${paramCount}`);
      params.push(filters.toDate);
      paramCount++;
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' GROUP BY g.id, u.username ORDER BY g.date, g.time';
    
    const result = await query(sql, params);
    return result.rows;
  },

  /**
   * Получает игру по ID
   */
  async getById(gameId) {
    const result = await query(
      `SELECT g.*,
              COUNT(DISTINCT gr.user_id) as registered_count,
              u.username as creator_username
       FROM games g
       LEFT JOIN game_registrations gr ON g.id = gr.game_id AND gr.status = 'registered'
       LEFT JOIN users u ON g.created_by = u.id
       WHERE g.id = $1
       GROUP BY g.id, u.username`,
      [gameId]
    );
    
    return result.rows[0];
  },

  /**
   * Создает новую игру
   */
  async create(gameData) {
    const { name, description, game_type, date, time, max_players, buy_in, created_by } = gameData;
    
    const result = await query(
      `INSERT INTO games (name, description, game_type, date, time, max_players, buy_in, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, description, game_type, date, time, max_players, buy_in, created_by]
    );
    
    return result.rows[0];
  },

  /**
   * Обновляет игру
   */
  async update(gameId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
    
    values.push(gameId);
    
    const result = await query(
      `UPDATE games SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );
    
    return result.rows[0];
  },

  /**
   * Удаляет игру
   */
  async delete(gameId) {
    await query('DELETE FROM games WHERE id = $1', [gameId]);
  },

  /**
   * Регистрирует пользователя на игру
   */
  async registerUser(gameId, userId) {
    // Проверяем, не заполнена ли игра
    const game = await this.getById(gameId);
    if (!game) {
      throw new Error('Game not found');
    }
    
    if (game.registered_count >= game.max_players) {
      throw new Error('Game is full');
    }
    
    // Регистрируем пользователя
    const result = await query(
      `INSERT INTO game_registrations (game_id, user_id, status)
       VALUES ($1, $2, 'registered')
       ON CONFLICT (game_id, user_id) 
       DO UPDATE SET status = 'registered', registered_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [gameId, userId]
    );
    
    return result.rows[0];
  },

  /**
   * Отменяет регистрацию пользователя
   */
  async unregisterUser(gameId, userId) {
    await query(
      `UPDATE game_registrations 
       SET status = 'cancelled'
       WHERE game_id = $1 AND user_id = $2`,
      [gameId, userId]
    );
  },

  /**
   * Получает список зарегистрированных пользователей
   */
  async getRegisteredUsers(gameId) {
    const result = await query(
      `SELECT u.id, u.telegram_id, u.username, u.first_name, u.last_name,
              u.photo_url, gr.registered_at, gr.status
       FROM game_registrations gr
       JOIN users u ON u.id = gr.user_id
       WHERE gr.game_id = $1 AND gr.status = 'registered'
       ORDER BY gr.registered_at`,
      [gameId]
    );
    
    return result.rows;
  },

  /**
   * Проверяет, зарегистрирован ли пользователь на игру
   */
  async isUserRegistered(gameId, userId) {
    const result = await query(
      `SELECT id FROM game_registrations
       WHERE game_id = $1 AND user_id = $2 AND status = 'registered'`,
      [gameId, userId]
    );
    
    return result.rows.length > 0;
  },

  /**
   * Получает игры пользователя
   */
  async getUserGames(userId, status = null) {
    let sql = `
      SELECT g.*, gr.registered_at, gr.status as registration_status,
             gr.position, gr.winnings
      FROM game_registrations gr
      JOIN games g ON g.id = gr.game_id
      WHERE gr.user_id = $1
    `;
    
    const params = [userId];
    
    if (status) {
      sql += ' AND gr.status = $2';
      params.push(status);
    }
    
    sql += ' ORDER BY g.date DESC, g.time DESC';
    
    const result = await query(sql, params);
    return result.rows;
  },

  /**
   * Завершает игру и обновляет статистику
   */
  async completeGame(gameId, results) {
    // results: [{ userId, position, winnings }, ...]
    
    // Обновляем статус игры
    await query(
      `UPDATE games SET status = 'completed' WHERE id = $1`,
      [gameId]
    );
    
    // Обновляем результаты участников
    for (const result of results) {
      await query(
        `UPDATE game_registrations 
         SET status = 'participated', position = $1, winnings = $2
         WHERE game_id = $3 AND user_id = $4`,
        [result.position, result.winnings, gameId, result.userId]
      );
      
      // Обновляем статистику пользователя
      await query(
        `UPDATE user_stats
         SET games_played = games_played + 1,
             games_won = games_won + CASE WHEN $1 = 1 THEN 1 ELSE 0 END,
             total_points = total_points + $2,
             total_winnings = total_winnings + $3
         WHERE user_id = $4`,
        [result.position, result.points || 0, result.winnings || 0, result.userId]
      );
      
      // Добавляем активность
      await query(
        `INSERT INTO user_activities (user_id, activity_type, description, related_id)
         VALUES ($1, $2, $3, $4)`,
        [
          result.userId,
          result.position === 1 ? 'game_won' : 'game_participated',
          result.position === 1 ? 'Победа в игре' : 'Участие в игре',
          gameId
        ]
      );
    }
  }
};

