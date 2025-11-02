import { query } from '../database/db.js';

export const TournamentPointStructure = {
  /**
   * Создать структуру очков для турнира
   */
  async create(gameId, structure) {
    // Удаляем старую структуру
    await this.deleteByGameId(gameId);

    // Создаем новую
    const values = structure.map((item, index) => 
      `($1, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4}, $${index * 4 + 5})`
    ).join(', ');

    const params = [gameId];
    structure.forEach(item => {
      params.push(item.place_from, item.place_to, item.points, item.prize_percentage || null);
    });

    const sql = `
      INSERT INTO tournament_point_structure 
      (game_id, place_from, place_to, points, prize_percentage)
      VALUES ${values}
      RETURNING *
    `;

    const result = await query(sql, params);
    return result.rows;
  },

  /**
   * Получить структуру для турнира
   */
  async getByGameId(gameId) {
    const result = await query(
      `SELECT * FROM tournament_point_structure
       WHERE game_id = $1
       ORDER BY place_from ASC`,
      [gameId]
    );

    return result.rows;
  },

  /**
   * Получить очки за конкретное место
   */
  async getPointsForPlace(gameId, position) {
    const result = await query(
      `SELECT points, prize_percentage
       FROM tournament_point_structure
       WHERE game_id = $1 
         AND place_from <= $2 
         AND place_to >= $2
       LIMIT 1`,
      [gameId, position]
    );

    return result.rows[0] || { points: 0, prize_percentage: 0 };
  },

  /**
   * Удалить структуру турнира
   */
  async deleteByGameId(gameId) {
    await query(
      'DELETE FROM tournament_point_structure WHERE game_id = $1',
      [gameId]
    );
  },

  /**
   * Создать стандартную структуру
   */
  async createDefault(gameId) {
    await query(
      'SELECT create_default_point_structure($1)',
      [gameId]
    );

    return await this.getByGameId(gameId);
  },

  /**
   * Обновить одну запись
   */
  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }

    values.push(id);

    const result = await query(
      `UPDATE tournament_point_structure
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0];
  },

  /**
   * Рассчитать распределение очков для всех игроков
   */
  async calculateAllPoints(gameId) {
    const result = await query(
      `SELECT 
         gr.user_id,
         gr.finish_position,
         tps.points,
         tps.prize_percentage
       FROM game_registrations gr
       LEFT JOIN tournament_point_structure tps 
         ON gr.game_id = tps.game_id
         AND gr.finish_position >= tps.place_from
         AND gr.finish_position <= tps.place_to
       WHERE gr.game_id = $1
         AND gr.finish_position IS NOT NULL
       ORDER BY gr.finish_position ASC`,
      [gameId]
    );

    return result.rows;
  }
};

