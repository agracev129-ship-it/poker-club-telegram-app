import express from 'express';
import { User } from '../models/User.js';
import { authenticateTelegram, requireAdmin } from '../middleware/telegram-auth.js';
import db from '../database/db.js';

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
    
    // Проверяем блокировку ПОСЛЕ создания пользователя
    if (user.is_blocked) {
      return res.status(403).json({ 
        error: 'Доступ заблокирован',
        message: 'Ваш аккаунт был заблокирован администратором. Обратитесь в поддержку для получения дополнительной информации.',
        blocked: true
      });
    }
    
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
 * GET /api/users/friends - Получить список друзей текущего пользователя
 */
router.get('/friends', authenticateTelegram, async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    const user = await User.findByTelegramId(telegramUser.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if friendships table exists
    const result = await db.query(
      `SELECT u.id, u.telegram_id, u.username, u.first_name, u.last_name, u.photo_url, u.is_admin, u.created_at, u.last_active
       FROM users u
       INNER JOIN friendships f ON (f.friend_id = u.id OR f.user_id = u.id)
       WHERE (f.user_id = $1 OR f.friend_id = $1) 
       AND f.status = 'accepted'
       AND u.id != $1
       ORDER BY u.first_name ASC`,
      [user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching friends:', error);
    // If friendships table doesn't exist, return empty array
    if (error.message?.includes('relation "friendships" does not exist')) {
      console.warn('Friendships table does not exist. Run init-friends-table.js');
      return res.json([]);
    }
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

/**
 * GET /api/users/friend-requests - Получить входящие запросы в друзья
 */
router.get('/friend-requests', authenticateTelegram, async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    const user = await User.findByTelegramId(telegramUser.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await db.query(
      `SELECT u.id, u.telegram_id, u.username, u.first_name, u.last_name, u.photo_url, u.is_admin, u.created_at, u.last_active
       FROM users u
       INNER JOIN friendships f ON f.user_id = u.id
       WHERE f.friend_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    // If friendships table doesn't exist, return empty array
    if (error.message?.includes('relation "friendships" does not exist')) {
      console.warn('Friendships table does not exist. Run init-friends-table.js');
      return res.json([]);
    }
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
});

/**
 * GET /api/users - Получить всех пользователей
 */
router.get('/', authenticateTelegram, async (req, res) => {
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

/**
 * POST /api/users/friend-request - Отправить запрос в друзья
 */
router.post('/friend-request', authenticateTelegram, async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    const user = await User.findByTelegramId(telegramUser.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { userId: friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: 'Friend user ID is required' });
    }

    if (user.id === friendId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if friendship already exists
    const existing = await db.query(
      'SELECT * FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
      [user.id, friendId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Friendship request already exists' });
    }

    // Create friend request
    await db.query(
      'INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, $3)',
      [user.id, friendId, 'pending']
    );

    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

/**
 * POST /api/users/accept-friend - Принять запрос в друзья
 */
router.post('/accept-friend', authenticateTelegram, async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    const user = await User.findByTelegramId(telegramUser.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { userId: friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: 'Friend user ID is required' });
    }

    // Update friendship status
    const result = await db.query(
      'UPDATE friendships SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND friend_id = $3 AND status = $4 RETURNING *',
      ['accepted', friendId, user.id, 'pending']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    res.json({ message: 'Friend request accepted successfully' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

/**
 * POST /api/users/decline-friend - Отклонить запрос в друзья
 */
router.post('/decline-friend', authenticateTelegram, async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    const user = await User.findByTelegramId(telegramUser.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { userId: friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: 'Friend user ID is required' });
    }

    // Delete friendship request
    const result = await db.query(
      'DELETE FROM friendships WHERE user_id = $1 AND friend_id = $2 AND status = $3 RETURNING *',
      [friendId, user.id, 'pending']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    res.json({ message: 'Friend request declined successfully' });
  } catch (error) {
    console.error('Error declining friend request:', error);
    res.status(500).json({ error: 'Failed to decline friend request' });
  }
});

/**
 * DELETE /api/users/cancel-friend-request - Отменить исходящий запрос в друзья
 */
router.delete('/cancel-friend-request', authenticateTelegram, async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    const user = await User.findByTelegramId(telegramUser.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { userId: friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: 'Friend user ID is required' });
    }

    // Delete outgoing friend request (user_id = current user, friend_id = target user, status = pending)
    const result = await db.query(
      'DELETE FROM friendships WHERE user_id = $1 AND friend_id = $2 AND status = $3 RETURNING *',
      [user.id, friendId, 'pending']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    res.json({ message: 'Friend request cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling friend request:', error);
    res.status(500).json({ error: 'Failed to cancel friend request' });
  }
});

/**
 * DELETE /api/users/remove-friend - Удалить из друзей
 */
router.delete('/remove-friend', authenticateTelegram, async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    const user = await User.findByTelegramId(telegramUser.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { userId: friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: 'Friend user ID is required' });
    }

    // Delete friendship (both directions)
    const result = await db.query(
      'DELETE FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1) RETURNING *',
      [user.id, friendId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

/**
 * GET /api/users/search - Поиск пользователей по имени (только для админов)
 */
router.get('/search', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const users = await User.search(q, 50);
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/users/:id/block - Заблокировать пользователя (только для админов)
 */
router.post('/:id/block', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await User.block(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User blocked successfully', user });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/users/:id/unblock - Разблокировать пользователя (только для админов)
 */
router.post('/:id/unblock', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await User.unblock(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User unblocked successfully', user });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

