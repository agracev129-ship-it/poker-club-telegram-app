import { query } from '../database/db.js';

export const TournamentPayment = {
  /**
   * Создать платеж
   */
  async create(paymentData) {
    const {
      game_id,
      user_id,
      registration_id,
      amount,
      payment_method,
      notes,
      confirmed_by
    } = paymentData;

    const result = await query(
      `INSERT INTO tournament_payments 
       (game_id, user_id, registration_id, amount, payment_method, status, confirmed_by, confirmed_at, notes)
       VALUES ($1, $2, $3, $4, $5, 'confirmed', $6, CURRENT_TIMESTAMP, $7)
       RETURNING *`,
      [game_id, user_id, registration_id, amount, payment_method, confirmed_by, notes]
    );

    return result.rows[0];
  },

  /**
   * Получить все платежи по игре
   */
  async getByGameId(gameId) {
    const result = await query(
      `SELECT tp.*, 
              u.name as user_name, 
              u.photo_url as user_photo,
              a.name as confirmed_by_name
       FROM tournament_payments tp
       JOIN users u ON tp.user_id = u.id
       LEFT JOIN users a ON tp.confirmed_by = a.id
       WHERE tp.game_id = $1
       ORDER BY tp.created_at DESC`,
      [gameId]
    );

    return result.rows;
  },

  /**
   * Получить платежи пользователя
   */
  async getByUserId(userId, gameId = null) {
    let sql = `
      SELECT tp.*, 
             g.name as game_name,
             g.date as game_date
      FROM tournament_payments tp
      JOIN games g ON tp.game_id = g.id
      WHERE tp.user_id = $1
    `;
    
    const params = [userId];
    
    if (gameId) {
      sql += ' AND tp.game_id = $2';
      params.push(gameId);
    }
    
    sql += ' ORDER BY tp.created_at DESC';

    const result = await query(sql, params);
    return result.rows;
  },

  /**
   * Обновить статус платежа
   */
  async updateStatus(paymentId, status, refundReason = null) {
    const result = await query(
      `UPDATE tournament_payments
       SET status = $1,
           refunded_at = CASE WHEN $1 = 'refunded' THEN CURRENT_TIMESTAMP ELSE refunded_at END,
           refund_reason = $2
       WHERE id = $3
       RETURNING *`,
      [status, refundReason, paymentId]
    );

    return result.rows[0];
  },

  /**
   * Возврат платежа
   */
  async refund(paymentId, refundReason, refundedBy) {
    const result = await query(
      `UPDATE tournament_payments
       SET status = 'refunded',
           refunded_at = CURRENT_TIMESTAMP,
           refund_reason = $1,
           confirmed_by = $2
       WHERE id = $3
       RETURNING *`,
      [refundReason, refundedBy, paymentId]
    );

    return result.rows[0];
  },

  /**
   * Получить статистику по платежам турнира
   */
  async getStats(gameId) {
    const result = await query(
      `SELECT 
         COUNT(*) as total_payments,
         COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
         COUNT(*) FILTER (WHERE status = 'refunded') as refunded_count,
         COALESCE(SUM(amount) FILTER (WHERE status = 'confirmed'), 0) as total_collected,
         COALESCE(SUM(amount) FILTER (WHERE status = 'refunded'), 0) as total_refunded
       FROM tournament_payments
       WHERE game_id = $1`,
      [gameId]
    );

    return result.rows[0];
  }
};

