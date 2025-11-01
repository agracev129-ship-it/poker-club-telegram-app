import express from 'express';
import { Game } from '../models/Game.js';
import { User } from '../models/User.js';
import { authenticateTelegram, requireAdmin, checkUserBlocked } from '../middleware/telegram-auth.js';

const router = express.Router();

/**
 * GET /api/games - Получить все игры
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate
    };
    
    const games = await Game.getAll(filters);
    res.json(games);
  } catch (error) {
    console.error('Error getting games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/games/:id - Получить игру по ID
 */
router.get('/:id', async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const game = await Game.getById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json(game);
  } catch (error) {
    console.error('Error getting game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/games - Создать новую игру (только для админов)
 */
router.post('/', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    const user = await User.findByTelegramId(telegramUser.id);
    
    const gameData = {
      ...req.body,
      created_by: user.id
    };
    
    const game = await Game.create(gameData);
    res.status(201).json(game);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/games/:id - Обновить игру (только для админов)
 */
router.put('/:id', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const updates = req.body;
    
    const game = await Game.update(gameId, updates);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json(game);
  } catch (error) {
    console.error('Error updating game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/games/:id - Удалить игру (только для админов)
 */
router.delete('/:id', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    await Game.delete(gameId);
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/games/:id/register - Зарегистрироваться на игру
 */
router.post('/:id/register', authenticateTelegram, checkUserBlocked, async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const telegramUser = req.telegramUser;
    const user = await User.findByTelegramId(telegramUser.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const registration = await Game.registerUser(gameId, user.id);
    res.status(201).json(registration);
  } catch (error) {
    console.error('Error registering for game:', error);
    
    if (error.message === 'Game not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Game is full') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/games/:id/register - Отменить регистрацию на игру
 */
router.delete('/:id/register', authenticateTelegram, checkUserBlocked, async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const telegramUser = req.telegramUser;
    const user = await User.findByTelegramId(telegramUser.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await Game.unregisterUser(gameId, user.id);
    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    console.error('Error unregistering from game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/games/:id/registrations - Получить список зарегистрированных пользователей
 */
router.get('/:id/registrations', async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const users = await Game.getRegisteredUsers(gameId);
    res.json(users);
  } catch (error) {
    console.error('Error getting registrations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/games/:id/check-registration - Проверить регистрацию пользователя
 */
router.get('/:id/check-registration', authenticateTelegram, async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const telegramUser = req.telegramUser;
    const user = await User.findByTelegramId(telegramUser.id);
    
    if (!user) {
      return res.json({ isRegistered: false });
    }
    
    const isRegistered = await Game.isUserRegistered(gameId, user.id);
    res.json({ isRegistered });
  } catch (error) {
    console.error('Error checking registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/games/:id/complete - Завершить игру (только для админов)
 */
router.post('/:id/complete', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const { results } = req.body; // [{ userId, position, winnings, points }, ...]
    
    await Game.completeGame(gameId, results);
    
    // Обновляем рейтинги
    await User.updateRankings();
    
    res.json({ message: 'Game completed successfully' });
  } catch (error) {
    console.error('Error completing game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/games/user/my-games - Получить игры пользователя
 */
router.get('/user/my-games', authenticateTelegram, async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    const user = await User.findByTelegramId(telegramUser.id);
    
    if (!user) {
      return res.json([]);
    }
    
    const games = await Game.getUserGames(user.id, req.query.status);
    res.json(games);
  } catch (error) {
    console.error('Error getting user games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/games/:id/start - Начать турнир (только для админов)
 */
router.post('/:id/start', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const assignments = await Game.startTournament(gameId);
    res.json({ message: 'Tournament started', assignments });
  } catch (error) {
    console.error('Error starting tournament:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/games/:id/seating - Получить рассадку игроков
 */
router.get('/:id/seating', async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const seating = await Game.getSeating(gameId);
    res.json(seating);
  } catch (error) {
    console.error('Error getting seating:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/games/:id/eliminate - Отметить игрока как выбывшего (только для админов)
 */
router.post('/:id/eliminate', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const { userId, finishPlace, pointsEarned } = req.body;
    
    await Game.eliminatePlayer(gameId, userId, finishPlace, pointsEarned);
    res.json({ message: 'Player eliminated' });
  } catch (error) {
    console.error('Error eliminating player:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/games/:id/restore - Восстановить игрока (только для админов)
 */
router.post('/:id/restore', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const { userId } = req.body;
    
    await Game.restorePlayer(gameId, userId);
    res.json({ message: 'Player restored' });
  } catch (error) {
    console.error('Error restoring player:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/games/:id/bonus-points - Начислить бонусные очки (только для админов)
 */
router.post('/:id/bonus-points', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const { userId, bonusPoints } = req.body;
    
    await Game.addBonusPoints(gameId, userId, bonusPoints);
    res.json({ message: 'Bonus points added' });
  } catch (error) {
    console.error('Error adding bonus points:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/games/:id/rebalance - Ребалансировать столы (только для админов)
 */
router.post('/:id/rebalance', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const { seating } = req.body;
    
    await Game.rebalanceTables(gameId, seating);
    res.json({ message: 'Tables rebalanced' });
  } catch (error) {
    console.error('Error rebalancing tables:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/games/:id/finish - Завершить турнир (только для админов)
 */
router.post('/:id/finish', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const results = await Game.finishTournament(gameId);
    res.json({ message: 'Tournament finished', results });
  } catch (error) {
    console.error('Error finishing tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/games/:id/cancel-start - Отменить начало турнира (только для админов)
 */
router.post('/:id/cancel-start', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    await Game.cancelTournamentStart(gameId);
    res.json({ message: 'Tournament start cancelled' });
  } catch (error) {
    console.error('Error cancelling tournament start:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/games/:id/results - Получить результаты завершенного турнира
 */
router.get('/:id/results', authenticateTelegram, async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const results = await Game.getTournamentResults(gameId);
    res.json(results);
  } catch (error) {
    console.error('Error getting tournament results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

