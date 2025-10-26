import express from 'express';
import { User } from '../models/User.js';
import { authenticateTelegram, requireAdmin } from '../middleware/telegram-auth.js';

const router = express.Router();

/**
 * GET /api/users/me - Получить профиль текущего пользователя
 */
router.get('/me', authenticateTelegram, async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    
    // Создаем или обновляем пользователя
    const user = await User.upsert({
      telegram_id: telegramUser.id,
      username: telegramUser.username,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      photo_url: telegramUser.photo_url
    });
    
    // Получаем полный профиль
    const profile = await User.getFullProfile(user.id);
    
    res.json(profile);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/stats - Получить статистику текущего пользователя
 */
router.get('/stats', authenticateTelegram, async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    const user = await User.findByTelegramId(telegramUser.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const stats = await User.getStats(user.id);
    res.json(stats);
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/leaderboard - Получить рейтинг игроков
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const leaderboard = await User.getLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users - Получить всех пользователей (только для админов)
 */
router.get('/', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const users = await User.getAll(limit, offset);
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/users/:id/stats - Обновить статистику пользователя (только для админов)
 */
router.put('/:id/stats', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const updates = req.body;
    
    // Проверяем допустимые поля
    const allowedFields = ['games_played', 'games_won', 'total_points', 'total_winnings'];
    const filteredUpdates = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }
    
    const stats = await User.updateStats(userId, filteredUpdates);
    
    // Обновляем рейтинги
    await User.updateRankings();
    
    res.json(stats);
  } catch (error) {
    console.error('Error updating user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

