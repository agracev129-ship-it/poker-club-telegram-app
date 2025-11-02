import { query } from '../database/db.js';

export const TournamentAction = {
  /**
   * Логировать действие администратора
   */
  async log(actionData) {
    const {
      game_id,
      admin_id,
      action_type,
      target_user_id,
      details
    } = actionData;

    const result = await query(
      `INSERT INTO tournament_actions_log 
       (game_id, admin_id, action_type, target_user_id, details)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [game_id, admin_id, action_type, target_user_id, JSON.stringify(details || {})]
    );

    return result.rows[0];
  },

  /**
   * Получить все действия по турниру
   */
  async getByGameId(gameId, limit = 100) {
    const result = await query(
      `SELECT tal.*,
              a.name as admin_name,
              a.photo_url as admin_photo,
              u.name as target_user_name,
              u.photo_url as target_user_photo
       FROM tournament_actions_log tal
       JOIN users a ON tal.admin_id = a.id
       LEFT JOIN users u ON tal.target_user_id = u.id
       WHERE tal.game_id = $1
       ORDER BY tal.created_at DESC
       LIMIT $2`,
      [gameId, limit]
    );

    return result.rows;
  },

  /**
   * Получить действия администратора
   */
  async getByAdminId(adminId, limit = 100) {
    const result = await query(
      `SELECT tal.*,
              g.name as game_name,
              g.date as game_date,
              u.name as target_user_name
       FROM tournament_actions_log tal
       JOIN games g ON tal.game_id = g.id
       LEFT JOIN users u ON tal.target_user_id = u.id
       WHERE tal.admin_id = $1
       ORDER BY tal.created_at DESC
       LIMIT $2`,
      [adminId, limit]
    );

    return result.rows;
  },

  /**
   * Получить действия по типу
   */
  async getByType(gameId, actionType) {
    const result = await query(
      `SELECT tal.*,
              a.name as admin_name,
              u.name as target_user_name
       FROM tournament_actions_log tal
       JOIN users a ON tal.admin_id = a.id
       LEFT JOIN users u ON tal.target_user_id = u.id
       WHERE tal.game_id = $1 AND tal.action_type = $2
       ORDER BY tal.created_at DESC`,
      [gameId, actionType]
    );

    return result.rows;
  },

  /**
   * Получить статистику действий
   */
  async getStats(gameId) {
    const result = await query(
      `SELECT 
         action_type,
         COUNT(*) as count,
         MAX(created_at) as last_action
       FROM tournament_actions_log
       WHERE game_id = $1
       GROUP BY action_type
       ORDER BY count DESC`,
      [gameId]
    );

    return result.rows;
  },

  /**
   * Получить последние действия
   */
  async getRecent(gameId, limit = 10) {
    const result = await query(
      `SELECT tal.*,
              a.name as admin_name,
              u.name as target_user_name
       FROM tournament_actions_log tal
       JOIN users a ON tal.admin_id = a.id
       LEFT JOIN users u ON tal.target_user_id = u.id
       WHERE tal.game_id = $1
       ORDER BY tal.created_at DESC
       LIMIT $2`,
      [gameId, limit]
    );

    return result.rows;
  }
};

