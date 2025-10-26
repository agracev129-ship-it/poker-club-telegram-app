import express from 'express';
import { Tournament } from '../models/Tournament.js';
import { User } from '../models/User.js';
import { authenticateTelegram, requireAdmin } from '../middleware/telegram-auth.js';

const router = express.Router();

/**
 * GET /api/tournaments - Получить все турниры
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      fromDate: req.query.fromDate
    };
    
    const tournaments = await Tournament.getAll(filters);
    res.json(tournaments);
  } catch (error) {
    console.error('Error getting tournaments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/tournaments/:id - Получить турнир по ID
 */
router.get('/:id', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const tournament = await Tournament.getById(tournamentId);
    
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    
    res.json(tournament);
  } catch (error) {
    console.error('Error getting tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/tournaments - Создать новый турнир (только для админов)
 */
router.post('/', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    const user = await User.findByTelegramId(telegramUser.id);
    
    const tournamentData = {
      ...req.body,
      created_by: user.id
    };
    
    const tournament = await Tournament.create(tournamentData);
    res.status(201).json(tournament);
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/tournaments/:id - Обновить турнир (только для админов)
 */
router.put('/:id', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const updates = req.body;
    
    const tournament = await Tournament.update(tournamentId, updates);
    
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    
    res.json(tournament);
  } catch (error) {
    console.error('Error updating tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/tournaments/:id - Удалить турнир (только для админов)
 */
router.delete('/:id', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    await Tournament.delete(tournamentId);
    res.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/tournaments/:id/register - Зарегистрироваться на турнир
 */
router.post('/:id/register', authenticateTelegram, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const telegramUser = req.telegramUser;
    const user = await User.findByTelegramId(telegramUser.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const registration = await Tournament.registerUser(tournamentId, user.id);
    res.status(201).json(registration);
  } catch (error) {
    console.error('Error registering for tournament:', error);
    
    if (error.message === 'Tournament not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Tournament is full') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/tournaments/:id/register - Отменить регистрацию на турнир
 */
router.delete('/:id/register', authenticateTelegram, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const telegramUser = req.telegramUser;
    const user = await User.findByTelegramId(telegramUser.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await Tournament.unregisterUser(tournamentId, user.id);
    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    console.error('Error unregistering from tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/tournaments/:id/registrations - Получить список зарегистрированных пользователей
 */
router.get('/:id/registrations', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const users = await Tournament.getRegisteredUsers(tournamentId);
    res.json(users);
  } catch (error) {
    console.error('Error getting registrations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/tournaments/:id/check-registration - Проверить регистрацию пользователя
 */
router.get('/:id/check-registration', authenticateTelegram, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const telegramUser = req.telegramUser;
    const user = await User.findByTelegramId(telegramUser.id);
    
    if (!user) {
      return res.json({ isRegistered: false });
    }
    
    const isRegistered = await Tournament.isUserRegistered(tournamentId, user.id);
    res.json({ isRegistered });
  } catch (error) {
    console.error('Error checking registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/tournaments/:id/complete - Завершить турнир (только для админов)
 */
router.post('/:id/complete', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const { results } = req.body; // [{ userId, position, winnings, points }, ...]
    
    await Tournament.completeTournament(tournamentId, results);
    
    // Обновляем рейтинги
    await User.updateRankings();
    
    res.json({ message: 'Tournament completed successfully' });
  } catch (error) {
    console.error('Error completing tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/tournaments/user/my-tournaments - Получить турниры пользователя
 */
router.get('/user/my-tournaments', authenticateTelegram, async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    const user = await User.findByTelegramId(telegramUser.id);
    
    if (!user) {
      return res.json([]);
    }
    
    const tournaments = await Tournament.getUserTournaments(user.id, req.query.status);
    res.json(tournaments);
  } catch (error) {
    console.error('Error getting user tournaments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

