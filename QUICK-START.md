# ⚡ Быстрый старт

## 🎯 Что сделано

### ✅ Backend (Сервер)
- Создана таблица `profile_change_requests` для модерации профилей
- Добавлено поле `is_blocked` в таблицу `users`
- Реализованы API endpoints для:
  - Модерации изменений профиля
  - Управления пользователями (блокировка/разблокировка)
  - Поиска пользователей
- Добавлены middleware для проверки блокировки

### ✅ Frontend (Клиент)
- Создан компонент `ProfileEditView` - форма изменения профиля пользователем
- Создан компонент `ProfileModerationView` - модерация заявок администратором
- Создан компонент `PlayersManagementView` - управление пользователями
- Создан компонент `AdminRatingTab` - управление сезонами рейтинга
- Обновлены контексты для работы с реальным API вместо localStorage
- Интегрированы все компоненты в приложение

### ✅ Документация
- Создана подробная инструкция `RENDER-SETUP-GUIDE.md`
- Создан файл `NEW-FEATURES.md` с описанием новых функций

---

## 🚀 Запуск локально (для тестирования)

### 1. Запустите PostgreSQL базу данных
```bash
# Если используете Docker:
docker run --name postgres-poker -e POSTGRES_PASSWORD=yourpassword -p 5432:5432 -d postgres
```

### 2. Настройте переменные окружения

Создайте файл `.env` в папке `server`:
```bash
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/poker_club
PORT=3001
TELEGRAM_BOT_TOKEN=ваш_токен_от_botfather
ADMIN_TELEGRAM_ID=ваш_telegram_id
NODE_ENV=development
```

### 3. Запустите backend
```bash
cd poker-club-telegram-app/server
npm install
node server.js
```

Должно появиться:
```
✅ Server running on port 3001
✅ Database connected and synced
```

### 4. Запустите frontend
```bash
cd poker-club-telegram-app/client
npm install
npm run dev
```

Должно открыться:
```
➜  Local:   http://localhost:5173/
```

---

## ☁️ Деплой на Render

### Краткая версия:

1. **Создайте PostgreSQL базу**
   - New + → PostgreSQL
   - Скопируйте "External Database URL"

2. **Задеплойте Backend**
   - New + → Web Service
   - Root Directory: `poker-club-telegram-app/server`
   - Build: `npm install`
   - Start: `node server.js`
   - Переменные окружения:
     ```
     DATABASE_URL=ваш_database_url
     TELEGRAM_BOT_TOKEN=ваш_токен
     ADMIN_TELEGRAM_ID=ваш_id
     ```

3. **Задеплойте Frontend**
   - New + → Web Service
   - Root Directory: `poker-club-telegram-app/client`
   - Build: `npm install && npm run build`
   - Start: `npx serve -s dist -l 10000`
   - Переменные окружения:
     ```
     VITE_API_URL=https://ваш-backend.onrender.com
     ```

4. **Настройте Telegram Bot**
   - @BotFather → `/newapp`
   - Укажите URL frontend

**Подробная инструкция:** см. `RENDER-SETUP-GUIDE.md`

---

## 📱 Как использовать новые функции

### Для пользователей:

**Изменить профиль:**
1. Откройте вкладку "Профиль"
2. Нажмите кнопку с карандашом (✏️)
3. Заполните форму
4. Нажмите "Отправить на модерацию"
5. Ожидайте решения администратора

### Для администраторов:

**Модерация профилей:**
1. Включите Admin Mode (Профиль → Admin Mode)
2. На главной странице нажмите "Модерация профилей"
3. Просмотрите заявки
4. Нажмите "Принять" или "Отклонить"

**Управление пользователями:**
1. Включите Admin Mode
2. На главной странице нажмите "Управление игроками"
3. Найдите нужного пользователя через поиск
4. Нажмите "Заблокировать" или "Разблокировать"

**Управление сезонами рейтинга:**
1. Включите Admin Mode
2. Перейдите во вкладку "Рейтинг"
3. Нажмите "Создать сезон"
4. Заполните форму и сохраните

---

## 🐛 Возможные проблемы

### "Database connection error"
- Проверьте правильность `DATABASE_URL`
- Убедитесь, что PostgreSQL запущен

### "CORS error" в браузере
- Проверьте `VITE_API_URL` в frontend
- Убедитесь, что backend доступен

### "Admin Mode" не появляется
- Проверьте `ADMIN_TELEGRAM_ID` в backend
- Убедитесь, что используете правильный Telegram аккаунт

---

## 📞 Структура проекта

```
poker-club-telegram-app/
├── server/                    # Backend (Node.js + Express)
│   ├── server.js             # Главный файл сервера
│   ├── models/               # Модели базы данных
│   │   ├── User.js
│   │   ├── Game.js
│   │   └── ProfileRequest.js # Новая модель
│   ├── routes/               # API endpoints
│   │   ├── users.js
│   │   ├── games.js
│   │   └── profileRequests.js # Новые routes
│   └── middleware/           # Middleware
│       └── auth.js
│
├── client/                   # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/      # React компоненты
│   │   │   ├── ProfileEditView.tsx        # Новый компонент
│   │   │   ├── ProfileModerationView.tsx  # Новый компонент
│   │   │   ├── PlayersManagementView.tsx  # Новый компонент
│   │   │   └── AdminRatingTab.tsx         # Новый компонент
│   │   ├── lib/
│   │   │   └── api.ts       # API клиент (обновлен)
│   │   └── hooks/           # Custom hooks
│
├── RENDER-SETUP-GUIDE.md    # Подробная инструкция по деплою
├── NEW-FEATURES.md          # Описание новых функций
└── QUICK-START.md           # Этот файл
```

---

## ✅ Чеклист

### Перед деплоем:
- [ ] PostgreSQL база создана
- [ ] Получен Telegram Bot Token
- [ ] Получен ваш Telegram ID
- [ ] Код залит в Git репозиторий (если используете GitHub)

### После деплоя:
- [ ] Backend показывает "Live" в Render
- [ ] Frontend показывает "Live" в Render
- [ ] Telegram Bot настроен с Mini App
- [ ] Приложение открывается в Telegram
- [ ] Регистрация работает
- [ ] Admin Mode доступен
- [ ] Новые функции работают

---

## 🎉 Готово!

**Backend:** Полностью готов к продакшену
**Frontend:** Собран и оптимизирован
**База данных:** Автоматически мигрируется при первом запуске

**Следующий шаг:** Смотрите `RENDER-SETUP-GUIDE.md` для деплоя!

