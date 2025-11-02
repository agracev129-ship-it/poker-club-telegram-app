import cron from 'node-cron';
import { Game } from '../models/Game.js';
import { TournamentAction } from '../models/TournamentAction.js';
import { query } from '../database/db.js';

console.log('🤖 Simplified Tournament Automation Jobs Initialized');

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
console.log('  • Archive old tournaments (daily 3 AM)');
console.log('  • Clean old logs (weekly Sunday 4 AM)');
console.log('  • Send reminders (every 30 min)');
console.log('  • Update prize pools (every hour)');

export default { initialized: true };

