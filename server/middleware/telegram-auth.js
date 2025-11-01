import crypto from 'crypto';
import dotenv from 'dotenv';
import { User } from '../models/User.js';

dotenv.config();

/**
 * Проверяет подлинность данных, полученных от Telegram Web App
 * @param {Object} initData - данные инициализации из Telegram
 * @returns {boolean} - true если данные валидны
 */
export function verifyTelegramWebAppData(initData) {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  
  if (!BOT_TOKEN) {
    console.error('BOT_TOKEN is not defined');
    return false;
  }

  try {
    // Парсим initData
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    // Создаем строку для проверки
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Создаем секретный ключ
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();
    
    // Создаем хеш для проверки
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    return calculatedHash === hash;
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    return false;
  }
}

/**
 * Middleware для проверки Telegram авторизации
 */
export async function authenticateTelegram(req, res, next) {
  const initData = req.headers['x-telegram-init-data'];
  
  if (!initData) {
    return res.status(401).json({ error: 'Unauthorized: No Telegram data provided' });
  }
  
  if (!verifyTelegramWebAppData(initData)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Telegram data' });
  }
  
  // Парсим данные пользователя
  try {
    const urlParams = new URLSearchParams(initData);
    const userDataStr = urlParams.get('user');
    if (userDataStr) {
      req.telegramUser = JSON.parse(userDataStr);
      
      // Находим или создаем пользователя в БД и добавляем в req.user
      const user = await User.findByTelegramId(req.telegramUser.id);
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    console.error('Error parsing user data:', error);
  }
  
  next();
}

/**
 * Middleware для проверки прав администратора
 */
export function requireAdmin(req, res, next) {
  const adminIds = process.env.ADMIN_TELEGRAM_IDS?.split(',').map(id => parseInt(id.trim())) || [];
  
  if (!req.telegramUser || !adminIds.includes(req.telegramUser.id)) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  
  next();
}

/**
 * Извлекает данные пользователя из Telegram init data
 */
export function extractUserFromInitData(initData) {
  try {
    const urlParams = new URLSearchParams(initData);
    const userDataStr = urlParams.get('user');
    if (userDataStr) {
      return JSON.parse(userDataStr);
    }
  } catch (error) {
    console.error('Error extracting user data:', error);
  }
  return null;
}

/**
 * Middleware для проверки блокировки пользователя
 * Должен использоваться после authenticateTelegram
 */
export async function checkUserBlocked(req, res, next) {
  try {
    if (!req.telegramUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const isBlocked = await User.isBlockedByTelegramId(req.telegramUser.id);
    
    if (isBlocked) {
      return res.status(403).json({ 
        error: 'Доступ заблокирован',
        message: 'Ваш аккаунт был заблокирован администратором. Обратитесь в поддержку для получения дополнительной информации.',
        blocked: true
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking user block status:', error);
    // В случае ошибки пропускаем пользователя (fail-open)
    next();
  }
}

