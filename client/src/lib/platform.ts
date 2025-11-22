/**
 * Утилиты для определения платформы устройства
 */

/**
 * Проверяет, является ли устройство iOS (iPhone, iPad)
 */
export function isIOS(): boolean {
  // Проверяем через Telegram Web App API
  const tg = (window as any).Telegram?.WebApp;
  if (tg?.platform) {
    return tg.platform === 'ios';
  }
  
  // Fallback: проверка через User Agent
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

/**
 * Возвращает CSS класс для отступа сверху на iOS
 * На iOS добавляет pt-16 (64px), на других устройствах - pt-4 (16px)
 */
export function getIOSPaddingTop(): string {
  return isIOS() ? 'pt-16' : 'pt-4';
}

/**
 * Возвращает пиксельное значение отступа для iOS
 */
export function getIOSPaddingTopPx(): number {
  return isIOS() ? 64 : 16;
}

