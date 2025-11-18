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

// Ленивая инициализация для избежания проблем с порядком загрузки
let _tg: typeof window.Telegram.WebApp | undefined;

function getTg() {
  if (typeof window !== 'undefined' && !_tg) {
    _tg = window.Telegram?.WebApp;
  }
  return _tg;
}

/**
 * Инициализирует Telegram Web App
 */
export function initTelegramApp() {
  const telegramApp = getTg();
  if (telegramApp) {
    telegramApp.ready();
    telegramApp.expand(); // Разворачивает приложение
    
    // Запрашиваем полноэкранный режим только для мобильных устройств
    const isMobile = ['android', 'ios', 'android_x'].includes(telegramApp.platform);
    if (isMobile && telegramApp.requestFullscreen) {
      telegramApp.requestFullscreen();
      console.log('Fullscreen mode enabled for mobile');
    }
    
    telegramApp.setHeaderColor('#000000');
    telegramApp.setBackgroundColor('#000000');
    console.log('Telegram Web App initialized');
    console.log('User:', telegramApp.initDataUnsafe.user);
    console.log('Platform:', telegramApp.platform);
    console.log('Is Mobile:', isMobile);
    console.log('IsExpanded:', telegramApp.isExpanded);
  } else {
    console.warn('Telegram Web App is not available. Using mock data for development.');
  }
}

/**
 * Получает данные пользователя из Telegram
 */
export function getTelegramUser() {
  const telegramApp = getTg();
  if (telegramApp?.initDataUnsafe.user) {
    return telegramApp.initDataUnsafe.user;
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
  const telegramApp = getTg();
  if (telegramApp?.initData) {
    return telegramApp.initData;
  }
  
  // Мок данные для разработки
  // В production это должно быть реальное initData от Telegram
  return 'query_id=mock&user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22testuser%22%7D&auth_date=1234567890&hash=mock_hash';
}

/**
 * Показывает главную кнопку Telegram
 */
export function showMainButton(text: string, onClick: () => void) {
  const telegramApp = getTg();
  if (telegramApp?.MainButton) {
    telegramApp.MainButton.setText(text);
    telegramApp.MainButton.onClick(onClick);
    telegramApp.MainButton.show();
  }
}

/**
 * Скрывает главную кнопку Telegram
 */
export function hideMainButton() {
  const telegramApp = getTg();
  if (telegramApp?.MainButton) {
    telegramApp.MainButton.hide();
  }
}

/**
 * Показывает кнопку "Назад" Telegram
 */
export function showBackButton(onClick: () => void) {
  const telegramApp = getTg();
  if (telegramApp?.BackButton) {
    telegramApp.BackButton.onClick(onClick);
    telegramApp.BackButton.show();
  }
}

/**
 * Скрывает кнопку "Назад" Telegram
 */
export function hideBackButton() {
  const telegramApp = getTg();
  if (telegramApp?.BackButton) {
    telegramApp.BackButton.hide();
  }
}

/**
 * Показывает алерт в Telegram
 */
export function showAlert(message: string) {
  const telegramApp = getTg();
  if (telegramApp) {
    telegramApp.showAlert(message);
  } else {
    alert(message);
  }
}

/**
 * Показывает подтверждение в Telegram
 */
export function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const telegramApp = getTg();
    if (telegramApp) {
      telegramApp.showConfirm(message, (confirmed) => resolve(confirmed));
    } else {
      resolve(confirm(message));
    }
  });
}

/**
 * Закрывает Telegram Mini App
 */
export function closeTelegramApp() {
  const telegramApp = getTg();
  if (telegramApp) {
    telegramApp.close();
  }
}

/**
 * Открывает ссылку в Telegram
 */
export function openTelegramLink(url: string) {
  const telegramApp = getTg();
  if (telegramApp) {
    telegramApp.openTelegramLink(url);
  } else {
    window.open(url, '_blank');
  }
}

/**
 * Открывает внешнюю ссылку
 */
export function openLink(url: string) {
  const telegramApp = getTg();
  if (telegramApp) {
    telegramApp.openLink(url);
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

export default getTg;

