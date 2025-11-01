import pool from '../database/db.js';

class ProfileRequest {
  // Создать новый запрос на изменение профиля
  static async create(userId, currentName, currentAvatarUrl, requestedName, requestedAvatarUrl) {
    const query = `
      INSERT INTO profile_change_requests 
        (user_id, current_name, current_avatar_url, requested_name, requested_avatar_url, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      userId,
      currentName,
      currentAvatarUrl || null,
      requestedName || null,
      requestedAvatarUrl || null
    ]);
    
    return result.rows[0];
  }

  // Получить все запросы (с фильтрацией по статусу)
  static async getAll(status = null) {
    let query = `
      SELECT 
        pcr.*,
        u.name as user_name,
        u.telegram_id,
        u.photo_url as user_avatar_url
      FROM profile_change_requests pcr
      JOIN users u ON pcr.user_id = u.id
    `;
    
    const params = [];
    
    if (status) {
      query += ' WHERE pcr.status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY pcr.created_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // Получить запрос по ID
  static async getById(requestId) {
    const query = `
      SELECT 
        pcr.*,
        u.name as user_name,
        u.telegram_id,
        u.photo_url as user_avatar_url
      FROM profile_change_requests pcr
      JOIN users u ON pcr.user_id = u.id
      WHERE pcr.id = $1
    `;
    
    const result = await pool.query(query, [requestId]);
    return result.rows[0];
  }

  // Одобрить запрос и применить изменения
  static async approve(requestId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Получить запрос
      const requestQuery = 'SELECT * FROM profile_change_requests WHERE id = $1';
      const requestResult = await client.query(requestQuery, [requestId]);
      
      if (requestResult.rows.length === 0) {
        throw new Error('Request not found');
      }
      
      const request = requestResult.rows[0];
      
      // Обновить статус запроса
      await client.query(
        'UPDATE profile_change_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['approved', requestId]
      );
      
      // Применить изменения к пользователю
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      if (request.requested_name) {
        updates.push(`name = $${paramIndex++}`);
        values.push(request.requested_name);
      }
      
      if (request.requested_avatar_url !== undefined) {
        updates.push(`avatar_url = $${paramIndex++}`);
        values.push(request.requested_avatar_url);
      }
      
      if (updates.length > 0) {
        values.push(request.user_id);
        const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
        await client.query(updateQuery, values);
      }
      
      await client.query('COMMIT');
      
      return request;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Отклонить запрос
  static async reject(requestId) {
    const query = `
      UPDATE profile_change_requests 
      SET status = 'rejected', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [requestId]);
    return result.rows[0];
  }

  // Удалить запрос
  static async delete(requestId) {
    const query = 'DELETE FROM profile_change_requests WHERE id = $1';
    await pool.query(query, [requestId]);
  }

  // Получить запросы конкретного пользователя
  static async getByUserId(userId, status = null) {
    let query = 'SELECT * FROM profile_change_requests WHERE user_id = $1';
    const params = [userId];
    
    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }
}

export default ProfileRequest;

