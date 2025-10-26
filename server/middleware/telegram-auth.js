import crypto from 'crypto';
import dotenv from 'dotenv';

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
export function authenticateTelegram(req, res, next) {
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

