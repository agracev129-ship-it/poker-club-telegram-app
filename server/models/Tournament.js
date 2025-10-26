import { query } from '../database/db.js';

export const Tournament = {
  /**
   * Получает все турниры
   */
  async getAll(filters = {}) {
    let sql = `
      SELECT t.*,
             COUNT(DISTINCT tr.user_id) as registered_count,
             u.username as creator_username
      FROM tournaments t
      LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id AND tr.status = 'registered'
      LEFT JOIN users u ON t.created_by = u.id
    `;
    
    const conditions = [];
    const params = [];
    let paramCount = 1;
    
    if (filters.status) {
      conditions.push(`t.status = $${paramCount}`);
      params.push(filters.status);
      paramCount++;
    }
    
    if (filters.fromDate) {
      conditions.push(`t.date >= $${paramCount}`);
      params.push(filters.fromDate);
      paramCount++;
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' GROUP BY t.id, u.username ORDER BY t.date, t.time';
    
    const result = await query(sql, params);
    return result.rows;
  },

  /**
   * Получает турнир по ID
   */
  async getById(tournamentId) {
    const result = await query(
      `SELECT t.*,
              COUNT(DISTINCT tr.user_id) as registered_count,
              u.username as creator_username
       FROM tournaments t
       LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id AND tr.status = 'registered'
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.id = $1
       GROUP BY t.id, u.username`,
      [tournamentId]
    );
    
    return result.rows[0];
  },

  /**
   * Создает новый турнир
   */
  async create(tournamentData) {
    const { name, description, prize_pool, date, time, max_players, buy_in, created_by } = tournamentData;
    
    const result = await query(
      `INSERT INTO tournaments (name, description, prize_pool, date, time, max_players, buy_in, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, description, prize_pool, date, time, max_players, buy_in, created_by]
    );
    
    return result.rows[0];
  },

  /**
   * Обновляет турнир
   */
  async update(tournamentId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
    
    values.push(tournamentId);
    
    const result = await query(
      `UPDATE tournaments SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );
    
    return result.rows[0];
  },

  /**
   * Удаляет турнир
   */
  async delete(tournamentId) {
    await query('DELETE FROM tournaments WHERE id = $1', [tournamentId]);
  },

  /**
   * Регистрирует пользователя на турнир
   */
  async registerUser(tournamentId, userId) {
    // Проверяем, не заполнен ли турнир
    const tournament = await this.getById(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }
    
    if (tournament.registered_count >= tournament.max_players) {
      throw new Error('Tournament is full');
    }
    
    // Регистрируем пользователя
    const result = await query(
      `INSERT INTO tournament_registrations (tournament_id, user_id, status)
       VALUES ($1, $2, 'registered')
       ON CONFLICT (tournament_id, user_id) 
       DO UPDATE SET status = 'registered', registered_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [tournamentId, userId]
    );
    
    return result.rows[0];
  },

  /**
   * Отменяет регистрацию пользователя
   */
  async unregisterUser(tournamentId, userId) {
    await query(
      `UPDATE tournament_registrations 
       SET status = 'cancelled'
       WHERE tournament_id = $1 AND user_id = $2`,
      [tournamentId, userId]
    );
  },

  /**
   * Получает список зарегистрированных пользователей
   */
  async getRegisteredUsers(tournamentId) {
    const result = await query(
      `SELECT u.id, u.telegram_id, u.username, u.first_name, u.last_name,
              u.photo_url, tr.registered_at, tr.status
       FROM tournament_registrations tr
       JOIN users u ON u.id = tr.user_id
       WHERE tr.tournament_id = $1 AND tr.status = 'registered'
       ORDER BY tr.registered_at`,
      [tournamentId]
    );
    
    return result.rows;
  },

  /**
   * Проверяет, зарегистрирован ли пользователь на турнир
   */
  async isUserRegistered(tournamentId, userId) {
    const result = await query(
      `SELECT id FROM tournament_registrations
       WHERE tournament_id = $1 AND user_id = $2 AND status = 'registered'`,
      [tournamentId, userId]
    );
    
    return result.rows.length > 0;
  },

  /**
   * Получает турниры пользователя
   */
  async getUserTournaments(userId, status = null) {
    let sql = `
      SELECT t.*, tr.registered_at, tr.status as registration_status,
             tr.position, tr.winnings
      FROM tournament_registrations tr
      JOIN tournaments t ON t.id = tr.tournament_id
      WHERE tr.user_id = $1
    `;
    
    const params = [userId];
    
    if (status) {
      sql += ' AND tr.status = $2';
      params.push(status);
    }
    
    sql += ' ORDER BY t.date DESC, t.time DESC';
    
    const result = await query(sql, params);
    return result.rows;
  },

  /**
   * Завершает турнир и обновляет статистику
   */
  async completeTournament(tournamentId, results) {
    // results: [{ userId, position, winnings, points }, ...]
    
    // Обновляем статус турнира
    await query(
      `UPDATE tournaments SET status = 'completed' WHERE id = $1`,
      [tournamentId]
    );
    
    // Обновляем результаты участников
    for (const result of results) {
      await query(
        `UPDATE tournament_registrations 
         SET status = 'participated', position = $1, winnings = $2
         WHERE tournament_id = $3 AND user_id = $4`,
        [result.position, result.winnings, tournamentId, result.userId]
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
          result.position === 1 ? 'Победа в турнире' : 'Участие в турнире',
          tournamentId
        ]
      );
    }
  }
};

