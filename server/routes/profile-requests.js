import express from 'express';
import ProfileRequest from '../models/ProfileRequest.js';
import { authenticateTelegram, requireAdmin, checkUserBlocked } from '../middleware/telegram-auth.js';

const router = express.Router();

// Создать новый запрос на изменение профиля (только для авторизованных пользователей)
router.post('/', authenticateTelegram, checkUserBlocked, async (req, res) => {
  try {
    const { currentName, currentAvatarUrl, requestedName, requestedAvatarUrl } = req.body;
    const userId = req.user.id;

    // Проверка что есть хотя бы одно изменение
    if (!requestedName && requestedAvatarUrl === undefined) {
      return res.status(400).json({ error: 'Необходимо указать хотя бы одно изменение' });
    }

    const request = await ProfileRequest.create(
      userId,
      currentName,
      currentAvatarUrl,
      requestedName,
      requestedAvatarUrl
    );

    res.json(request);
  } catch (error) {
    console.error('Error creating profile request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получить все запросы (только для админов)
router.get('/', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const requests = await ProfileRequest.getAll(status);
    res.json(requests);
  } catch (error) {
    console.error('Error getting profile requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получить запросы текущего пользователя
router.get('/my', authenticateTelegram, checkUserBlocked, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    const requests = await ProfileRequest.getByUserId(userId, status);
    res.json(requests);
  } catch (error) {
    console.error('Error getting user profile requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получить конкретный запрос (только для админов)
router.get('/:id', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const request = await ProfileRequest.getById(requestId);
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Error getting profile request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Одобрить запрос (только для админов)
router.post('/:id/approve', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const request = await ProfileRequest.approve(requestId);
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Error approving profile request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Отклонить запрос (только для админов)
router.post('/:id/reject', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const request = await ProfileRequest.reject(requestId);
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Error rejecting profile request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Удалить запрос (только для админов)
router.delete('/:id', authenticateTelegram, requireAdmin, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    await ProfileRequest.delete(requestId);
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile request:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

