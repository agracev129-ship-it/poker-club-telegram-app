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
    console.error('❌ BOT_TOKEN is not defined in environment variables');
    console.error('💡 Please set BOT_TOKEN in your .env file or Render environment variables');
    return false;
  }

  // Логируем начало проверки (без чувствительных данных)
  console.log('🔍 Verifying Telegram WebApp data...');
  console.log('✅ BOT_TOKEN is set (length:', BOT_TOKEN.length, 'chars)');

  try {
    // Парсим initData
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    const userDataStr = urlParams.get('user');
    
    if (!hash) {
      console.error('❌ Hash not found in initData');
      return false;
    }
    
    if (!userDataStr) {
      console.error('❌ User data not found in initData');
      return false;
    }
    
    // Логируем наличие данных (без чувствительной информации)
    try {
      const userData = JSON.parse(userDataStr);
      console.log('✅ User data found:', {
        id: userData.id,
        first_name: userData.first_name,
        username: userData.username || 'no username'
      });
    } catch (e) {
      console.warn('⚠️ Could not parse user data for logging');
    }
    
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
    
    const isValid = calculatedHash === hash;
    
    if (!isValid) {
      console.error('❌ Telegram data verification failed');
      console.error('   Expected hash:', hash.substring(0, 10) + '...');
      console.error('   Calculated hash:', calculatedHash.substring(0, 10) + '...');
      console.error('💡 This usually means BOT_TOKEN is incorrect or outdated');
      console.error('💡 If you recreated the bot, update BOT_TOKEN in environment variables');
    } else {
      console.log('✅ Telegram data verification successful');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying Telegram data:', error);
    console.error('   Error details:', error.message);
    return false;
  }
}

/**
 * Middleware для проверки Telegram авторизации
 */
export async function authenticateTelegram(req, res, next) {
  const initData = req.headers['x-telegram-init-data'];
  
  console.log('🔐 Authenticating Telegram request...');
  console.log('   Has initData:', !!initData);
  
  if (!initData) {
    console.error('❌ No Telegram initData in request headers');
    console.error('   Available headers:', Object.keys(req.headers).filter(h => h.toLowerCase().includes('telegram')));
    return res.status(401).json({ error: 'Unauthorized: No Telegram data provided' });
  }
  
  console.log('   InitData length:', initData.length);
  
  if (!verifyTelegramWebAppData(initData)) {
    console.error('❌ Telegram data verification failed');
    return res.status(401).json({ 
      error: 'Unauthorized: Invalid Telegram data',
      message: 'BOT_TOKEN may be incorrect. If you recreated the bot, update BOT_TOKEN in environment variables.'
    });
  }
  
  // Парсим данные пользователя
  try {
    const urlParams = new URLSearchParams(initData);
    const userDataStr = urlParams.get('user');
    if (userDataStr) {
      req.telegramUser = JSON.parse(userDataStr);
      console.log('✅ User data parsed:', {
        id: req.telegramUser.id,
        first_name: req.telegramUser.first_name,
        username: req.telegramUser.username || 'no username'
      });
      
      // Находим или создаем пользователя в БД и добавляем в req.user
      const user = await User.findByTelegramId(req.telegramUser.id);
      if (user) {
        req.user = user;
        console.log('✅ User found in database:', user.id);
      } else {
        console.log('⚠️ User not found in database, will be created on first API call');
      }
    } else {
      console.error('❌ User data not found in initData');
    }
  } catch (error) {
    console.error('❌ Error parsing user data:', error);
    console.error('   Error details:', error.message);
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

