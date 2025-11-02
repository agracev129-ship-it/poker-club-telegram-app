import cron from 'node-cron';
import { Game } from '../models/Game.js';
import { TournamentAction } from '../models/TournamentAction.js';
import { query } from '../database/db.js';

console.log('🤖 Tournament Automation Jobs Initialized');

/**
 * Автоматическое открытие регистрации за 7 дней до турнира
 * Runs every hour
 */
cron.schedule('0 * * * *', async () => {
  try {
    console.log('🔄 Checking for tournaments to open registration...');
    
    const result = await query(
      `SELECT * FROM games
       WHERE tournament_status = 'upcoming'
         AND game_type = 'tournament'
         AND date >= CURRENT_DATE
         AND date <= CURRENT_DATE + INTERVAL '7 days'
         AND auto_close_registration = true`,
      []
    );
    
    for (const game of result.rows) {
      // Открываем регистрацию
      await query(
        `UPDATE games 
         SET tournament_status = 'registration_open'
         WHERE id = $1`,
        [game.id]
      );
      
      // Логируем автоматическое действие
      await TournamentAction.log({
        game_id: game.id,
        admin_id: 1, // System admin ID
        action_type: 'open_registration',
        details: { automated: true, timestamp: new Date() }
      });
      
      console.log(`✅ Opened registration for tournament: ${game.name} (ID: ${game.id})`);
    }
  } catch (error) {
    console.error('❌ Error auto-opening registration:', error);
  }
});

/**
 * Автоматическое начало check-in за 1 час до турнира
 * Runs every 15 minutes
 */
cron.schedule('*/15 * * * *', async () => {
  try {
    console.log('🔄 Checking for tournaments to start check-in...');
    
    const result = await query(
      `SELECT * FROM games
       WHERE tournament_status = 'registration_open'
         AND game_type = 'tournament'
         AND (date::timestamp + time::time) <= NOW() + INTERVAL '1 hour'
         AND (date::timestamp + time::time) > NOW()`,
      []
    );
    
    for (const game of result.rows) {
      await query(
        `UPDATE games 
         SET tournament_status = 'check_in',
             check_in_opens_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [game.id]
      );
      
      await TournamentAction.log({
        game_id: game.id,
        admin_id: 1,
        action_type: 'start_check_in',
        details: { automated: true }
      });
      
      console.log(`✅ Started check-in for tournament: ${game.name} (ID: ${game.id})`);
      
      // TODO: Send notification to admins via Telegram
    }
  } catch (error) {
    console.error('❌ Error auto-starting check-in:', error);
  }
});

/**
 * Автоматическое исключение неявившихся за 10 минут до турнира
 * Runs every 5 minutes
 */
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('🔄 Checking for no-show exclusion...');
    
    const result = await query(
      `SELECT * FROM games
       WHERE tournament_status = 'check_in'
         AND auto_exclude_no_show = true
         AND (date::timestamp + time::time) <= NOW() + INTERVAL '10 minutes'
         AND (date::timestamp + time::time) > NOW()`,
      []
    );
    
    for (const game of result.rows) {
      // Исключаем всех, кто не отметился
      const excluded = await query(
        `UPDATE game_registrations
         SET status = 'no_show'
         WHERE game_id = $1 
           AND status = 'registered'
         RETURNING *`,
        [game.id]
      );
      
      // Логируем для каждого исключенного
      for (const reg of excluded.rows) {
        await TournamentAction.log({
          game_id: game.id,
          admin_id: 1,
          action_type: 'mark_no_show',
          target_user_id: reg.user_id,
          details: { automated: true, auto_excluded: true }
        });
      }
      
      // Обновляем статус турнира
      await query(
        `UPDATE games 
         SET tournament_status = 'finalizing'
         WHERE id = $1`,
        [game.id]
      );
      
      console.log(`✅ Excluded ${excluded.rows.length} no-shows for tournament: ${game.name} (ID: ${game.id})`);
    }
  } catch (error) {
    console.error('❌ Error auto-excluding no-shows:', error);
  }
});

/**
 * Закрытие поздней регистрации
 * Runs every 10 minutes
 */
cron.schedule('*/10 * * * *', async () => {
  try {
    console.log('🔄 Checking for late registration closure...');
    
    const result = await query(
      `SELECT * FROM games
       WHERE tournament_status = 'late_registration'
         AND late_registration_ends_at IS NOT NULL
         AND late_registration_ends_at <= NOW()`,
      []
    );
    
    for (const game of result.rows) {
      await query(
        `UPDATE games 
         SET tournament_status = 'in_progress'
         WHERE id = $1`,
        [game.id]
      );
      
      await TournamentAction.log({
        game_id: game.id,
        admin_id: 1,
        action_type: 'close_registration',
        details: { automated: true, late_registration_closed: true }
      });
      
      console.log(`✅ Closed late registration for tournament: ${game.name} (ID: ${game.id})`);
    }
  } catch (error) {
    console.error('❌ Error closing late registration:', error);
  }
});

/**
 * Архивация завершенных турниров старше 30 дней
 * Runs daily at 3 AM
 */
cron.schedule('0 3 * * *', async () => {
  try {
    console.log('🔄 Archiving old tournaments...');
    
    const result = await query(
      `UPDATE games
       SET tournament_status = 'archived'
       WHERE tournament_status = 'completed'
         AND finished_at < NOW() - INTERVAL '30 days'
       RETURNING *`,
      []
    );
    
    console.log(`✅ Archived ${result.rows.length} tournaments`);
  } catch (error) {
    console.error('❌ Error archiving tournaments:', error);
  }
});

/**
 * Очистка старых логов действий (старше 6 месяцев)
 * Runs weekly on Sunday at 4 AM
 */
cron.schedule('0 4 * * 0', async () => {
  try {
    console.log('🔄 Cleaning old action logs...');
    
    const result = await query(
      `DELETE FROM tournament_actions_log
       WHERE created_at < NOW() - INTERVAL '6 months'
       RETURNING *`,
      []
    );
    
    console.log(`✅ Cleaned ${result.rows.length} old action logs`);
  } catch (error) {
    console.error('❌ Error cleaning action logs:', error);
  }
});

/**
 * Проверка состояния турниров и отправка напоминаний
 * Runs every 30 minutes
 */
cron.schedule('*/30 * * * *', async () => {
  try {
    console.log('🔄 Checking tournament status for reminders...');
    
    // Находим турниры, которые начинаются через 24 часа
    const upcoming = await query(
      `SELECT * FROM games
       WHERE tournament_status IN ('registration_open', 'upcoming')
         AND (date::timestamp + time::time) > NOW() + INTERVAL '23 hours'
         AND (date::timestamp + time::time) <= NOW() + INTERVAL '24 hours'`,
      []
    );
    
    // TODO: Отправить уведомления зарегистрированным игрокам
    if (upcoming.rows.length > 0) {
      console.log(`📢 ${upcoming.rows.length} tournaments starting in 24 hours`);
    }
    
    // Находим турниры, которые начинаются через 1 час
    const soon = await query(
      `SELECT * FROM games
       WHERE tournament_status IN ('check_in', 'finalizing')
         AND (date::timestamp + time::time) > NOW() + INTERVAL '55 minutes'
         AND (date::timestamp + time::time) <= NOW() + INTERVAL '65 minutes'`,
      []
    );
    
    if (soon.rows.length > 0) {
      console.log(`⏰ ${soon.rows.length} tournaments starting in 1 hour`);
    }
  } catch (error) {
    console.error('❌ Error checking reminders:', error);
  }
});

/**
 * Обновление статистики призовых фондов
 * Runs every hour
 */
cron.schedule('0 * * * *', async () => {
  try {
    console.log('🔄 Updating prize pools...');
    
    const games = await query(
      `SELECT id FROM games
       WHERE tournament_status IN ('check_in', 'finalizing', 'started', 'late_registration', 'in_progress')`,
      []
    );
    
    for (const game of games.rows) {
      await query(
        `UPDATE games
         SET total_prize_pool = (
           SELECT COALESCE(SUM(payment_amount), 0)
           FROM game_registrations
           WHERE game_id = $1 AND payment_status = 'paid'
         )
         WHERE id = $1`,
        [game.id]
      );
    }
    
    console.log(`✅ Updated prize pools for ${games.rows.length} tournaments`);
  } catch (error) {
    console.error('❌ Error updating prize pools:', error);
  }
});

console.log('✅ All cron jobs scheduled successfully');
console.log('📋 Active jobs:');
console.log('  • Auto-open registration (every hour)');
console.log('  • Auto-start check-in (every 15 min)');
console.log('  • Auto-exclude no-shows (every 5 min)');
console.log('  • Close late registration (every 10 min)');
console.log('  • Archive old tournaments (daily 3 AM)');
console.log('  • Clean old logs (weekly Sunday 4 AM)');
console.log('  • Send reminders (every 30 min)');
console.log('  • Update prize pools (every hour)');

export default { initialized: true };

