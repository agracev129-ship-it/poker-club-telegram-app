import { query } from '../database/db.js';

export const Game = {
  /**
   * Получает все игры
   */
  async getAll(filters = {}) {
    let sql = `
      SELECT g.*,
             u.username as creator_username
      FROM games g
      LEFT JOIN users u ON g.created_by = u.id
    `;
    
    const conditions = [];
    const params = [];
    let paramCount = 1;
    
    // Фильтр по tournament_status (если передан как status)
    if (filters.status && filters.status !== 'all') {
      // ВАЖНО: 'upcoming' включает и 'started' турниры, чтобы они не исчезали после начала
      if (filters.status === 'upcoming') {
        conditions.push(`(g.tournament_status = 'upcoming' OR g.tournament_status = 'started' OR (g.tournament_status IS NULL AND g.status = 'upcoming'))`);
      } else {
        // Для других статусов используем обычную фильтрацию
        conditions.push(`(g.tournament_status = $${paramCount} OR (g.tournament_status IS NULL AND g.status = $${paramCount}))`);
        params.push(filters.status);
        paramCount++;
      }
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
    
    sql += ' ORDER BY g.date, g.time';
    
    const result = await query(sql, params);
    
    // Добавляем registered_count для каждой игры отдельно
    for (const game of result.rows) {
      const countResult = await query(
        `SELECT COUNT(DISTINCT gr.user_id) as count
         FROM game_registrations gr
         WHERE gr.game_id = $1
           AND (
             ($2 = 'started' AND gr.status IN ('paid', 'playing'))
             OR ($2 != 'started' OR $2 IS NULL) AND gr.status = 'registered'
           )`,
        [game.id, game.tournament_status]
      );
      game.registered_count = parseInt(countResult.rows[0].count) || 0;
    }
    
    return result.rows;
  },

  /**
   * Получает игру по ID
   */
  async getById(gameId) {
    const result = await query(
      `SELECT g.*,
              u.username as creator_username
       FROM games g
       LEFT JOIN users u ON g.created_by = u.id
       WHERE g.id = $1`,
      [gameId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const game = result.rows[0];
    
    // Добавляем registered_count отдельным запросом
    const countResult = await query(
      `SELECT COUNT(DISTINCT gr.user_id) as count
       FROM game_registrations gr
       WHERE gr.game_id = $1
         AND (
           ($2 = 'started' AND gr.status IN ('paid', 'playing'))
           OR ($2 != 'started' OR $2 IS NULL) AND gr.status = 'registered'
         )`,
      [gameId, game.tournament_status]
    );
    game.registered_count = parseInt(countResult.rows[0].count) || 0;
    
    return game;
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
   * Для начатого турнира возвращает игроков со статусом 'paid' или 'playing'
   * Для ожидающего турнира возвращает игроков со статусом 'registered'
   */
  async getRegisteredUsers(gameId) {
    // Сначала проверяем статус турнира
    const game = await this.getById(gameId);
    const isStarted = game.tournament_status === 'started';
    
    // Для начатого турнира показываем игроков, которые участвуют (paid/playing)
    // Для ожидающего турнира показываем зарегистрированных (registered)
    let sql;
    let params;
    
    if (isStarted) {
      sql = `SELECT u.id, u.telegram_id, u.username, u.first_name, u.last_name,
                    u.photo_url, gr.registered_at, gr.status
             FROM game_registrations gr
             JOIN users u ON u.id = gr.user_id
             WHERE gr.game_id = $1 AND gr.status IN ('paid', 'playing')
             ORDER BY gr.registered_at`;
      params = [gameId];
    } else {
      sql = `SELECT u.id, u.telegram_id, u.username, u.first_name, u.last_name,
                    u.photo_url, gr.registered_at, gr.status
             FROM game_registrations gr
             JOIN users u ON u.id = gr.user_id
             WHERE gr.game_id = $1 AND gr.status = 'registered'
             ORDER BY gr.registered_at`;
      params = [gameId];
    }
    
    const result = await query(sql, params);
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
   * status может быть: 'registered', 'paid', 'playing', 'started' (статус турнира)
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
      // Если статус 'started', фильтруем по tournament_status
      // Иначе фильтруем по статусу регистрации
      if (status === 'started') {
        sql += ' AND g.tournament_status = $2';
        params.push('started');
      } else {
        sql += ' AND gr.status = $2';
        params.push(status);
      }
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
   * ИСПРАВЛЕНО: Начинает турнир и генерирует рассадку ТОЛЬКО для оплативших
   */
  async startTournament(gameId) {
    // ВАЖНО: Получаем только игроков со статусом 'paid' (оплативших)
    const paidPlayers = await query(
      `SELECT gr.user_id, u.id, u.first_name, u.last_name, u.photo_url
       FROM game_registrations gr
       JOIN users u ON gr.user_id = u.id
       WHERE gr.game_id = $1 AND gr.status = 'paid'
       ORDER BY gr.registered_at`,
      [gameId]
    );
    
    if (paidPlayers.rows.length === 0) {
      throw new Error('No paid players - cannot start tournament');
    }

    // Обновляем статус турнира
    // ВАЖНО: Обновляем только tournament_status, так как started_at может не существовать
    await query(
      `UPDATE games SET tournament_status = 'started' WHERE id = $1`,
      [gameId]
    );

    // Генерируем рассадку (9 игроков за столом)
    const playersPerTable = 9;
    const shuffledPlayers = [...paidPlayers.rows].sort(() => Math.random() - 0.5);

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
        [gameId, player.user_id, tableNumber, seatNumber]
      );

      // Обновляем статус регистрации на 'playing'
      // ВАЖНО: table_number и seat_number хранятся в table_assignments, а не в game_registrations
      await query(
        `UPDATE game_registrations 
         SET status = 'playing'
         WHERE game_id = $1 AND user_id = $2`,
        [gameId, player.user_id]
      );

      assignments.push({
        userId: player.user_id,
        userName: `${player.first_name} ${player.last_name || ''}`.trim(),
        tableNumber,
        seatNumber,
      });
    }

    // Логируем
    const { TournamentAction } = await import('./TournamentAction.js');
    await TournamentAction.log({
      game_id: gameId,
      admin_id: 1, // system
      action_type: 'start_tournament',
      details: { players_count: shuffledPlayers.length, tables_count: Math.ceil(shuffledPlayers.length / playersPerTable) }
    });

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
    console.log('finishTournament called for gameId:', gameId);
    
    try {
      // Получаем всех игроков с рассадкой
      const seating = await this.getSeating(gameId);
      console.log('Seating players:', seating.length);
      
      // Получаем всех игроков, которые участвуют в турнире (paid/playing)
      // ВАЖНО: Для начатого турнира ищем игроков со статусом 'paid' или 'playing'
      const registrationsResult = await query(
        `SELECT gr.user_id, u.first_name, u.last_name
         FROM game_registrations gr
         JOIN users u ON gr.user_id = u.id
         WHERE gr.game_id = $1 AND gr.status IN ('paid', 'playing')`,
        [gameId]
      );
      const allRegistered = registrationsResult.rows;
      console.log('Registered players (paid/playing):', allRegistered.length);

      // ВАЖНО: Сначала обновляем статус турнира, чтобы он попал в историю
      // даже если обработка игроков упадет с ошибкой
      const updateResult = await query(
        `UPDATE games SET tournament_status = 'finished' WHERE id = $1 RETURNING *`,
        [gameId]
      );
      
      if (updateResult.rows.length === 0) {
        throw new Error('Tournament not found');
      }
      
      console.log('Tournament status updated to finished:', updateResult.rows[0].tournament_status);

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
          try {
            // Обновляем статистику пользователя (создаем если нет)
            // ВАЖНО: Обернуто в try-catch, так как таблица может не существовать
            try {
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
            } catch (statsError) {
              console.warn('Error updating user_stats (non-critical):', statsError.message);
            }

            // Обновляем регистрацию
            // ВАЖНО: position может не существовать, используем только status
            await query(
              `UPDATE game_registrations 
               SET status = 'participated'
               WHERE game_id = $1 AND user_id = $2`,
              [gameId, registration.user_id]
            );

            // Добавляем активность (опционально, может не существовать)
            try {
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
            } catch (activityError) {
              console.warn('Error inserting user_activities (non-critical):', activityError.message);
            }
          } catch (error) {
            console.error(`Error processing player ${registration.user_id}:`, error);
            // Продолжаем обработку других игроков
          }
        } else {
          // Игрок не участвовал - помечаем регистрацию как cancelled
          try {
            await query(
              `UPDATE game_registrations 
               SET status = 'cancelled'
               WHERE game_id = $1 AND user_id = $2`,
              [gameId, registration.user_id]
            );
          } catch (error) {
            console.error(`Error cancelling registration for player ${registration.user_id}:`, error);
          }
        }
      }

      // Обновляем рейтинги (опционально, может не работать если таблица не существует)
      try {
        const { default: User } = await import('./User.js');
        await User.updateRankings();
        console.log('Rankings updated successfully');
      } catch (rankingsError) {
        console.warn('Error updating rankings (non-critical):', rankingsError.message);
      }

      console.log('Tournament finished successfully. Total players processed:', allRegistered.length);
      
      // Возвращаем рассадку для обратной совместимости
      return seating;
    } catch (error) {
      console.error('Error in finishTournament:', error);
      console.error('Error stack:', error.stack);
      
      // Даже если произошла ошибка, проверяем что статус обновлен
      // чтобы турнир попал в историю
      try {
        const checkResult = await query(
          `SELECT tournament_status FROM games WHERE id = $1`,
          [gameId]
        );
        if (checkResult.rows.length > 0 && checkResult.rows[0].tournament_status === 'finished') {
          console.log('Tournament status is finished, returning empty seating');
          return [];
        }
      } catch (checkError) {
        console.error('Error checking tournament status:', checkError);
      }
      
      throw error;
    }
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
  },

  // ============================================================================
  // УПРОЩЕННЫЕ МЕТОДЫ ДЛЯ УПРАВЛЕНИЯ ТУРНИРОМ
  // ============================================================================

  /**
   * УПРОЩЕНО: Подтвердить оплату игрока (переводит из registered в paid)
   */
  async confirmPayment(gameId, userId, adminId, paymentData) {
    const { amount, payment_method, notes } = paymentData;

    console.log('Game.confirmPayment called:', {
      gameId,
      userId,
      adminId,
      amount,
      payment_method
    });

    // Проверяем текущий статус регистрации
    const currentReg = await query(
      `SELECT * FROM game_registrations WHERE game_id = $1 AND user_id = $2`,
      [gameId, userId]
    );

    if (currentReg.rows.length === 0) {
      console.error('Registration not found for gameId:', gameId, 'userId:', userId);
      throw new Error('Registration not found');
    }

    console.log('Current registration status:', currentReg.rows[0].status);

    // Обновляем регистрацию - теперь игрок оплатил
    // ВАЖНО: Игрок остается в турнире, только меняется статус с 'registered' на 'paid'
    // Все данные о платеже хранятся в таблице tournament_payments
    const regResult = await query(
      `UPDATE game_registrations
       SET status = 'paid'
       WHERE game_id = $1 AND user_id = $2
       RETURNING *`,
      [gameId, userId]
    );

    if (regResult.rows.length === 0) {
      console.error('Failed to update registration status');
      throw new Error('Failed to update registration');
    }

    const registration = regResult.rows[0];
    console.log('Registration updated to paid:', {
      id: registration.id,
      game_id: registration.game_id,
      user_id: registration.user_id,
      status: registration.status
    });

    // Создаем запись о платеже
    const { TournamentPayment } = await import('./TournamentPayment.js');
    await TournamentPayment.create({
      game_id: gameId,
      user_id: userId,
      registration_id: registration.id,
      amount,
      payment_method,
      notes,
      confirmed_by: adminId
    });

    // Логируем
    const { TournamentAction } = await import('./TournamentAction.js');
    await TournamentAction.log({
      game_id: gameId,
      admin_id: adminId,
      action_type: 'confirm_payment',
      target_user_id: userId,
      details: { amount, payment_method }
    });

    // НОВОЕ: Сразу генерируем рассадку для этого игрока, если турнир уже начался
    const game = await this.getById(gameId);
    if (game.tournament_status === 'started') {
      await this.assignSeatToPlayer(gameId, userId);
    }

    // Проверяем, что игрок действительно остался в турнире со статусом 'paid'
    const verifyReg = await query(
      `SELECT * FROM game_registrations WHERE game_id = $1 AND user_id = $2`,
      [gameId, userId]
    );

    if (verifyReg.rows.length === 0) {
      console.error('ERROR: Player was removed from tournament after payment confirmation!');
      throw new Error('Player was removed from tournament');
    }

    if (verifyReg.rows[0].status !== 'paid') {
      console.error('ERROR: Player status is not "paid" after confirmation:', verifyReg.rows[0].status);
      throw new Error(`Player status is ${verifyReg.rows[0].status}, expected "paid"`);
    }

    console.log('Payment confirmation completed successfully. Player remains in tournament with status "paid":', {
      registrationId: verifyReg.rows[0].id,
      userId: verifyReg.rows[0].user_id,
      status: verifyReg.rows[0].status
    });

    return registration;
  },

  /**
   * НОВОЕ: Автоматически назначить место игроку
   */
  async assignSeatToPlayer(gameId, userId) {
    // Получаем текущую рассадку
    const seating = await query(
      `SELECT table_number, seat_number FROM table_assignments WHERE game_id = $1`,
      [gameId]
    );

    // Находим свободное место
    const occupiedSeats = new Set(seating.rows.map(s => `${s.table_number}-${s.seat_number}`));
    const playersPerTable = 9;
    
    let freeTable = 1;
    let freeSeat = 1;
    let found = false;

    // Ищем свободное место
    for (let table = 1; table <= 20; table++) {
      for (let seat = 1; seat <= playersPerTable; seat++) {
        if (!occupiedSeats.has(`${table}-${seat}`)) {
          freeTable = table;
          freeSeat = seat;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    // Добавляем игрока в рассадку
    await query(
      `INSERT INTO table_assignments (game_id, user_id, table_number, seat_number)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (game_id, user_id) DO UPDATE 
       SET table_number = $3, seat_number = $4`,
      [gameId, userId, freeTable, freeSeat]
    );

    return { table_number: freeTable, seat_number: freeSeat };
  },

  /**
   * Отметить игрока как не явившегося
   */
  async markNoShow(gameId, userId, adminId, reason = null) {
    const result = await query(
      `UPDATE game_registrations
       SET status = 'no_show'
       WHERE game_id = $1 AND user_id = $2
       RETURNING *`,
      [gameId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Registration not found');
    }

    const { TournamentAction } = await import('./TournamentAction.js');
    await TournamentAction.log({
      game_id: gameId,
      admin_id: adminId,
      action_type: 'mark_no_show',
      target_user_id: userId,
      details: { reason }
    });

    return result.rows[0];
  },

  /**
   * Восстановить игрока (отменить no_show)
   */
  async restorePlayer(gameId, userId, adminId) {
    const result = await query(
      `UPDATE game_registrations
       SET status = 'registered'
       WHERE game_id = $1 AND user_id = $2
       RETURNING *`,
      [gameId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Registration not found');
    }

    const { TournamentAction } = await import('./TournamentAction.js');
    await TournamentAction.log({
      game_id: gameId,
      admin_id: adminId,
      action_type: 'restore_player',
      target_user_id: userId
    });

    return result.rows[0];
  },

  /**
   * УПРОЩЕНО: Регистрация игрока на месте (сразу как оплаченный)
   */
  async onsiteRegistration(gameId, userId, adminId, paymentData) {
    const { amount, payment_method, notes } = paymentData;

    // Проверяем не зарегистрирован ли уже
    const existing = await query(
      'SELECT * FROM game_registrations WHERE game_id = $1 AND user_id = $2',
      [gameId, userId]
    );

    let registration;

    if (existing.rows.length > 0) {
      // Обновляем существующую регистрацию
      // Все данные о платеже хранятся в таблице tournament_payments
      const result = await query(
        `UPDATE game_registrations
         SET status = 'paid',
             registration_type = 'onsite'
         WHERE game_id = $1 AND user_id = $2
         RETURNING *`,
        [gameId, userId]
      );
      registration = result.rows[0];
    } else {
      // Создаем новую регистрацию
      // Все данные о платеже хранятся в таблице tournament_payments
      const result = await query(
        `INSERT INTO game_registrations 
         (game_id, user_id, status, registration_type)
         VALUES ($1, $2, 'paid', 'onsite')
         RETURNING *`,
        [gameId, userId]
      );
      registration = result.rows[0];
    }

    // Создаем запись о платеже
    const { TournamentPayment } = await import('./TournamentPayment.js');
    await TournamentPayment.create({
      game_id: gameId,
      user_id: userId,
      registration_id: registration.id,
      amount,
      payment_method,
      notes,
      confirmed_by: adminId
    });

    // Логируем
    const { TournamentAction } = await import('./TournamentAction.js');
    await TournamentAction.log({
      game_id: gameId,
      admin_id: adminId,
      action_type: 'onsite_registration',
      target_user_id: userId,
      details: { amount, payment_method }
    });

    return registration;
  },

  /**
   * УПРОЩЕНО: Поздняя регистрация (автоматический поиск места)
   */
  async lateRegistration(gameId, userId, adminId, paymentData) {
    const { amount, payment_method, notes } = paymentData;

    // Проверяем статус турнира
    const game = await this.getById(gameId);
    if (!['started', 'in_progress'].includes(game.tournament_status)) {
      throw new Error('Late registration is only available during the tournament');
    }

    // Автоматически находим свободное место
    const seat = await this.assignSeatToPlayer(gameId, userId);

    // Создаем регистрацию
    // ВАЖНО: table_number и seat_number хранятся в table_assignments, а не в game_registrations
    // Все данные о платеже хранятся в таблице tournament_payments
    const result = await query(
      `INSERT INTO game_registrations 
       (game_id, user_id, status, registration_type, is_late_entry)
       VALUES ($1, $2, 'paid', 'late', true)
       ON CONFLICT (game_id, user_id) DO UPDATE
       SET status = 'paid',
           is_late_entry = true
       RETURNING *`,
      [gameId, userId]
    );

    const registration = result.rows[0];

    // Создаем запись о платеже
    const { TournamentPayment } = await import('./TournamentPayment.js');
    await TournamentPayment.create({
      game_id: gameId,
      user_id: userId,
      registration_id: registration.id,
      amount,
      payment_method,
      notes,
      confirmed_by: adminId
    });

    // Логируем
    const { TournamentAction } = await import('./TournamentAction.js');
    await TournamentAction.log({
      game_id: gameId,
      admin_id: adminId,
      action_type: 'late_registration',
      target_user_id: userId,
      details: { amount, payment_method, table: seat.table_number, seat: seat.seat_number }
    });

    return registration;
  },

  /**
   * Исключить всех неявившихся игроков
   */
  async excludeAllNoShow(gameId, adminId) {
    const result = await query(
      `UPDATE game_registrations
       SET status = 'no_show'
       WHERE game_id = $1 
         AND status = 'registered'
       RETURNING *`,
      [gameId]
    );

    // Логируем для каждого игрока
    const { TournamentAction } = await import('./TournamentAction.js');
    for (const reg of result.rows) {
      await TournamentAction.log({
        game_id: gameId,
        admin_id: adminId,
        action_type: 'mark_no_show',
        target_user_id: reg.user_id,
        details: { auto_excluded: true }
      });
    }

    return result.rows;
  },

  /**
   * Получить статистику турнира
   */
  async getTournamentStats(gameId) {
    const result = await query(
      'SELECT * FROM get_tournament_stats($1)',
      [gameId]
    );

    return result.rows[0];
  },

  /**
   * Получить игроков по статусу
   */
  async getPlayersByStatus(gameId, status) {
    const result = await query(
      `SELECT gr.*, 
              u.name as user_name,
              u.first_name,
              u.last_name,
              u.photo_url,
              u.telegram_id
       FROM game_registrations gr
       JOIN users u ON gr.user_id = u.id
       WHERE gr.game_id = $1 AND gr.status = $2
       ORDER BY gr.registered_at ASC`,
      [gameId, status]
    );

    // Добавляем данные о платежах отдельным запросом
    if (result.rows.length > 0) {
      const userIds = result.rows.map(r => r.user_id);
      try {
        const paymentsResult = await query(
          `SELECT DISTINCT ON (user_id) 
                  user_id, amount, payment_method, created_at
           FROM tournament_payments
           WHERE game_id = $1 AND user_id = ANY($2::int[])
           ORDER BY user_id, created_at DESC`,
          [gameId, userIds]
        );
        
        const paymentsMap = new Map();
        paymentsResult.rows.forEach(p => {
          paymentsMap.set(p.user_id, {
            payment_amount: p.amount,
            payment_method: p.payment_method,
            paid_at: p.created_at
          });
        });
        
        result.rows.forEach(row => {
          const payment = paymentsMap.get(row.user_id);
          if (payment) {
            row.payment_amount = payment.payment_amount;
            row.payment_method = payment.payment_method;
            row.paid_at = payment.paid_at;
          }
        });
      } catch (paymentError) {
        console.warn('Error loading payments (non-critical):', paymentError.message);
      }
    }

    return result.rows;
  },

  /**
   * Финализировать результаты турнира с автоматическим начислением очков
   */
  async finalizeResults(gameId, adminId, options = {}) {
    const { autoCalculatePoints = true, manualAdjustments = [] } = options;

    // Получаем структуру очков
    const { TournamentPointStructure } = await import('./TournamentPointStructure.js');
    const pointStructure = await TournamentPointStructure.getByGameId(gameId);

    if (autoCalculatePoints && pointStructure.length > 0) {
      // Получаем всех игроков с результатами
      const players = await query(
        `SELECT user_id, finish_position
         FROM game_registrations
         WHERE game_id = $1 
           AND finish_position IS NOT NULL
           AND status = 'eliminated'`,
        [gameId]
      );

      // Рассчитываем и начисляем очки
      for (const player of players.rows) {
        const pointsData = await TournamentPointStructure.getPointsForPlace(
          gameId, 
          player.finish_position
        );

        await query(
          `UPDATE game_registrations
           SET points_earned = $1
           WHERE game_id = $2 AND user_id = $3`,
          [pointsData.points, gameId, player.user_id]
        );

        // Обновляем статистику пользователя
        await query(
          `INSERT INTO user_stats (user_id, games_played, games_won, total_points)
           VALUES ($1, 1, $2, $3)
           ON CONFLICT (user_id) 
           DO UPDATE SET 
             games_played = user_stats.games_played + 1,
             games_won = user_stats.games_won + $2,
             total_points = user_stats.total_points + $3`,
          [player.user_id, player.finish_position === 1 ? 1 : 0, pointsData.points]
        );
      }
    }

    // Применяем ручные корректировки
    for (const adjustment of manualAdjustments) {
      const { userId, bonusPoints, reason } = adjustment;
      
      await query(
        `UPDATE game_registrations
         SET points_earned = COALESCE(points_earned, 0) + $1
         WHERE game_id = $2 AND user_id = $3`,
        [bonusPoints, gameId, userId]
      );

      await query(
        `UPDATE user_stats
         SET total_points = total_points + $1
         WHERE user_id = $2`,
        [bonusPoints, userId]
      );
    }

    // Обновляем статус игры
    // ВАЖНО: Обновляем только tournament_status, так как finished_at может не существовать
    await query(
      `UPDATE games 
       SET tournament_status = 'completed'
       WHERE id = $1`,
      [gameId]
    );

    // Обновляем рейтинги
    const { default: User } = await import('./User.js');
    await User.updateRankings();

    // Логируем
    const { TournamentAction } = await import('./TournamentAction.js');
    await TournamentAction.log({
      game_id: gameId,
      admin_id: adminId,
      action_type: 'finish_tournament',
      details: { autoCalculatePoints, manualAdjustments }
    });

    return await this.getTournamentResults(gameId);
  }
};

