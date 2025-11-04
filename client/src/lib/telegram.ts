// Типы для Telegram Web App
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
            photo_url?: string;
          };
          auth_date: number;
          hash: string;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        colorScheme: 'light' | 'dark';
        version: string;
        platform: string;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        onEvent: (eventType: string, eventHandler: () => void) => void;
        offEvent: (eventType: string, eventHandler: () => void) => void;
        sendData: (data: string) => void;
        requestFullscreen: () => void;
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink: (url: string) => void;
        showPopup: (params: {
          title?: string;
          message: string;
          buttons?: Array<{
            id?: string;
            type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
            text?: string;
          }>;
        }, callback?: (buttonId: string) => void) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
      };
    };
  }
}

export const tg = window.Telegram?.WebApp;

/**
 * Инициализирует Telegram Web App
 */
export function initTelegramApp() {
  if (tg) {
    tg.ready();
    tg.expand(); // Разворачивает приложение
    
    // Запрашиваем полноэкранный режим
    if (tg.requestFullscreen) {
      tg.requestFullscreen();
    }
    
    tg.setHeaderColor('#000000');
    tg.setBackgroundColor('#000000');
    console.log('Telegram Web App initialized');
    console.log('User:', tg.initDataUnsafe.user);
    console.log('Platform:', tg.platform);
    console.log('IsExpanded:', tg.isExpanded);
  } else {
    console.warn('Telegram Web App is not available. Using mock data for development.');
  }
}

/**
 * Получает данные пользователя из Telegram
 */
export function getTelegramUser() {
  if (tg?.initDataUnsafe.user) {
    return tg.initDataUnsafe.user;
  }
  
  // Мок данные для разработки
  return {
    id: 123456789,
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser',
    language_code: 'ru',
    photo_url: undefined
  };
}

/**
 * Получает initData для авторизации на сервере
 */
export function getTelegramInitData(): string {
  if (tg?.initData) {
    return tg.initData;
  }
  
  // Мок данные для разработки
  // В production это должно быть реальное initData от Telegram
  return 'query_id=mock&user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22testuser%22%7D&auth_date=1234567890&hash=mock_hash';
}

/**
 * Показывает главную кнопку Telegram
 */
export function showMainButton(text: string, onClick: () => void) {
  if (tg?.MainButton) {
    tg.MainButton.setText(text);
    tg.MainButton.onClick(onClick);
    tg.MainButton.show();
  }
}

/**
 * Скрывает главную кнопку Telegram
 */
export function hideMainButton() {
  if (tg?.MainButton) {
    tg.MainButton.hide();
  }
}

/**
 * Показывает кнопку "Назад" Telegram
 */
export function showBackButton(onClick: () => void) {
  if (tg?.BackButton) {
    tg.BackButton.onClick(onClick);
    tg.BackButton.show();
  }
}

/**
 * Скрывает кнопку "Назад" Telegram
 */
export function hideBackButton() {
  if (tg?.BackButton) {
    tg.BackButton.hide();
  }
}

/**
 * Показывает алерт в Telegram
 */
export function showAlert(message: string) {
  if (tg) {
    tg.showAlert(message);
  } else {
    alert(message);
  }
}

/**
 * Показывает подтверждение в Telegram
 */
export function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (tg) {
      tg.showConfirm(message, (confirmed) => resolve(confirmed));
    } else {
      resolve(confirm(message));
    }
  });
}

/**
 * Закрывает Telegram Mini App
 */
export function closeTelegramApp() {
  if (tg) {
    tg.close();
  }
}

/**
 * Открывает ссылку в Telegram
 */
export function openTelegramLink(url: string) {
  if (tg) {
    tg.openTelegramLink(url);
  } else {
    window.open(url, '_blank');
  }
}

/**
 * Открывает внешнюю ссылку
 */
export function openLink(url: string) {
  if (tg) {
    tg.openLink(url);
  } else {
    window.open(url, '_blank');
  }
}

/**
 * Вызывает вибрацию (если доступна)
 */
export function vibrate(type: 'light' | 'medium' | 'heavy' = 'medium') {
  if (window.navigator.vibrate) {
    const duration = type === 'light' ? 10 : type === 'medium' ? 20 : 30;
    window.navigator.vibrate(duration);
  }
}

export default tg;

