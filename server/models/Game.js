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
    
    // Фильтр по tournament_status (если передан как status)
    if (filters.status && filters.status !== 'all') {
      // Проверяем есть ли поле tournament_status
      conditions.push(`(g.tournament_status = $${paramCount} OR (g.tournament_status IS NULL AND g.status = $${paramCount}))`);
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
  },

  /**
   * Начинает турнир и генерирует рассадку
   */
  async startTournament(gameId) {
    // Получаем список зарегистрированных игроков
    const registrations = await this.getRegisteredUsers(gameId);
    
    if (registrations.length === 0) {
      throw new Error('No players registered');
    }

    // Обновляем статус турнира
    await query(
      `UPDATE games SET tournament_status = 'started' WHERE id = $1`,
      [gameId]
    );

    // Генерируем рассадку (10 игроков за столом)
    const playersPerTable = 10;
    const shuffledPlayers = [...registrations].sort(() => Math.random() - 0.5);

    // Удаляем старые назначения если есть
    await query('DELETE FROM table_assignments WHERE game_id = $1', [gameId]);

    // Создаем новые назначения
    const assignments = [];
    for (let i = 0; i < shuffledPlayers.length; i++) {
      const player = shuffledPlayers[i];
      const tableNumber = Math.floor(i / playersPerTable) + 1;
      const seatNumber = (i % playersPerTable) + 1;

      await query(
        `INSERT INTO table_assignments (game_id, user_id, table_number, seat_number)
         VALUES ($1, $2, $3, $4)`,
        [gameId, player.id, tableNumber, seatNumber]
      );

      assignments.push({
        userId: player.id,
        userName: `${player.first_name} ${player.last_name || ''}`.trim(),
        tableNumber,
        seatNumber,
      });
    }

    return assignments;
  },

  /**
   * Получает рассадку игроков для турнира
   */
  async getSeating(gameId) {
    const result = await query(
      `SELECT ta.*, u.first_name, u.last_name, u.username, u.photo_url
       FROM table_assignments ta
       JOIN users u ON u.id = ta.user_id
       WHERE ta.game_id = $1
       ORDER BY ta.table_number, ta.seat_number`,
      [gameId]
    );

    return result.rows;
  },

  /**
   * Отмечает игрока как выбывшего
   */
  async eliminatePlayer(gameId, userId, finishPlace, pointsEarned) {
    await query(
      `UPDATE table_assignments
       SET is_eliminated = true, finish_place = $1, points_earned = $2, updated_at = CURRENT_TIMESTAMP
       WHERE game_id = $3 AND user_id = $4`,
      [finishPlace, pointsEarned, gameId, userId]
    );
  },

  /**
   * Восстанавливает игрока
   */
  async restorePlayer(gameId, userId) {
    await query(
      `UPDATE table_assignments
       SET is_eliminated = false, finish_place = NULL, points_earned = 0, updated_at = CURRENT_TIMESTAMP
       WHERE game_id = $1 AND user_id = $2`,
      [gameId, userId]
    );
  },

  /**
   * Начисляет бонусные очки игроку
   */
  async addBonusPoints(gameId, userId, bonusPoints) {
    await query(
      `UPDATE table_assignments
       SET bonus_points = bonus_points + $1, updated_at = CURRENT_TIMESTAMP
       WHERE game_id = $2 AND user_id = $3`,
      [bonusPoints, gameId, userId]
    );
  },

  /**
   * Ребалансировка столов (обновление рассадки)
   */
  async rebalanceTables(gameId, newSeating) {
    // newSeating: [{ userId, tableNumber, seatNumber }, ...]
    for (const assignment of newSeating) {
      await query(
        `UPDATE table_assignments
         SET table_number = $1, seat_number = $2, updated_at = CURRENT_TIMESTAMP
         WHERE game_id = $3 AND user_id = $4`,
        [assignment.tableNumber, assignment.seatNumber, gameId, assignment.userId]
      );
    }
  },

  /**
   * Завершает турнир и начисляет очки всем игрокам
   */
  async finishTournament(gameId) {
    // Получаем всех игроков с рассадкой
    const seating = await this.getSeating(gameId);
    
    // Получаем всех зарегистрированных игроков (включая тех кто не в рассадке)
    const registrationsResult = await query(
      `SELECT gr.user_id, u.first_name, u.last_name
       FROM game_registrations gr
       JOIN users u ON gr.user_id = u.id
       WHERE gr.game_id = $1 AND gr.status = 'registered'`,
      [gameId]
    );
    const allRegistered = registrationsResult.rows;

    // Обновляем статус турнира
    await query(
      `UPDATE games SET tournament_status = 'finished', status = 'completed' WHERE id = $1`,
      [gameId]
    );

    // Создаем Map для быстрого поиска игроков в рассадке
    const seatingMap = new Map(seating.map(p => [p.user_id, p]));

    // Начисляем очки каждому игроку
    for (const registration of allRegistered) {
      const playerInSeating = seatingMap.get(registration.user_id);
      
      let totalPoints = 0;
      let finishPlace = null;
      let participated = false;

      if (playerInSeating) {
        // Игрок был в рассадке
        if (playerInSeating.is_eliminated && playerInSeating.points_earned !== null) {
          totalPoints = (playerInSeating.points_earned || 0) + (playerInSeating.bonus_points || 0);
          finishPlace = playerInSeating.finish_place;
          participated = true;
        } else if (playerInSeating.is_eliminated === false) {
          // Игрок активен на момент завершения - начисляем 0 очков но засчитываем участие
          totalPoints = (playerInSeating.bonus_points || 0);
          participated = true;
        }
      } else {
        // Игрок зарегистрирован но не был в рассадке (турнир завершен до старта или игрок не явился)
        participated = false;
      }

      if (participated) {
        // Обновляем статистику пользователя (создаем если нет)
        await query(
          `INSERT INTO user_stats (user_id, games_played, games_won, total_points)
           VALUES ($1, 1, $2, $3)
           ON CONFLICT (user_id) 
           DO UPDATE SET 
             games_played = user_stats.games_played + 1,
             games_won = user_stats.games_won + $2,
             total_points = user_stats.total_points + $3`,
          [registration.user_id, finishPlace === 1 ? 1 : 0, totalPoints]
        );

        // Обновляем регистрацию
        await query(
          `UPDATE game_registrations 
           SET status = 'participated', position = $1
           WHERE game_id = $2 AND user_id = $3`,
          [finishPlace, gameId, registration.user_id]
        );

        // Добавляем активность
        const description = finishPlace === 1 
          ? 'Победа в турнире'
          : finishPlace 
          ? `${finishPlace}-е место в турнире`
          : 'Участие в турнире';
          
        await query(
          `INSERT INTO user_activities (user_id, activity_type, description, related_id)
           VALUES ($1, $2, $3, $4)`,
          [
            registration.user_id,
            finishPlace === 1 ? 'game_won' : 'game_participated',
            description,
            gameId
          ]
        );
      } else {
        // Игрок не участвовал - помечаем регистрацию как cancelled
        await query(
          `UPDATE game_registrations 
           SET status = 'cancelled'
           WHERE game_id = $1 AND user_id = $2`,
          [gameId, registration.user_id]
        );
      }
    }

    // Обновляем рейтинги
    const { default: User } = await import('./User.js');
    await User.updateRankings();

    return seating;
  },

  /**
   * Отменяет начало турнира (возвращает в статус upcoming)
   */
  async cancelTournamentStart(gameId) {
    // Удаляем рассадку
    await query('DELETE FROM table_assignments WHERE game_id = $1', [gameId]);
    
    // Возвращаем статус
    await query(
      `UPDATE games SET tournament_status = 'upcoming' WHERE id = $1`,
      [gameId]
    );
  },

  /**
   * Получает результаты завершенного турнира с участниками и их местами
   */
  async getTournamentResults(gameId) {
    // Получаем информацию о турнире
    const gameResult = await query(
      `SELECT g.*, COUNT(DISTINCT gr.user_id) as total_players
       FROM games g
       LEFT JOIN game_registrations gr ON g.id = gr.game_id AND gr.status IN ('registered', 'participated')
       WHERE g.id = $1
       GROUP BY g.id`,
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      throw new Error('Game not found');
    }

    const game = gameResult.rows[0];

    // Получаем участников с их результатами из table_assignments
    const participantsResult = await query(
      `SELECT 
        ta.user_id,
        ta.finish_place,
        ta.points_earned,
        ta.bonus_points,
        ta.is_eliminated,
        u.first_name,
        u.last_name,
        u.username,
        u.photo_url,
        gr.status as registration_status
       FROM game_registrations gr
       JOIN users u ON gr.user_id = u.id
       LEFT JOIN table_assignments ta ON ta.game_id = gr.game_id AND ta.user_id = gr.user_id
       WHERE gr.game_id = $1
       ORDER BY 
         CASE 
           WHEN ta.finish_place IS NULL THEN 9999
           ELSE ta.finish_place
         END ASC`,
      [gameId]
    );

    return {
      game: {
        id: game.id,
        name: game.name,
        description: game.description,
        date: game.date,
        time: game.time,
        buy_in: game.buy_in,
        max_players: game.max_players,
        total_players: game.total_players,
        tournament_status: game.tournament_status,
      },
      participants: participantsResult.rows.map(p => ({
        user_id: p.user_id,
        first_name: p.first_name,
        last_name: p.last_name,
        username: p.username,
        photo_url: p.photo_url,
        finish_place: p.finish_place,
        points_earned: p.points_earned || 0,
        bonus_points: p.bonus_points || 0,
        total_points: (p.points_earned || 0) + (p.bonus_points || 0),
        participated: p.registration_status === 'participated',
      })),
    };
  }
};

