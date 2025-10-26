# 🔗 Быстрые ссылки и шпаргалка

## 📱 Ваши данные

```
🤖 Bot Token: 8003396192:AAG8HulBW7CQa25gIgkfqZ-9UZYzjLcp-OA
👤 Telegram ID: 609464085
📧 Для админки: Только вы (ID 609464085)
```

---

## 🌐 Важные ссылки

### Render (Хостинг)
- 🏠 Dashboard: https://dashboard.render.com
- 📚 Документация: https://render.com/docs
- 💰 Цены: https://render.com/pricing

### Telegram
- 🤖 BotFather: https://t.me/botfather
- 🆔 UserInfoBot: https://t.me/userinfobot
- 📖 Bot API: https://core.telegram.org/bots/api
- 🎨 Web Apps: https://core.telegram.org/bots/webapps

### GitHub
- 🏠 GitHub: https://github.com
- 📚 Docs: https://docs.github.com

### Инструменты
- 🗄️ PostgreSQL GUI: https://dbeaver.io
- 📝 Postman: https://www.postman.com
- 🔧 VSCode: https://code.visualstudio.com

---

## 📋 Команды Telegram BotFather

### Создание и настройка бота:
```
/newbot          - Создать нового бота
/mybots          - Список ваших ботов
/setname         - Изменить имя бота
/setdescription  - Установить описание
/setabouttext    - Текст "О боте"
/setuserpic      - Установить аватар
/setcommands     - Настроить команды
/deletebot       - Удалить бота
```

### Настройка Web App:
```
/setmenubutton   - Настроить кнопку Menu (ВАЖНО!)
```

Для настройки Menu Button:
1. `/setmenubutton`
2. Выберите бота
3. Введите текст: `Открыть клуб`
4. Введите URL: `[ваш frontend URL]`

---

## 🔧 Environment Variables (для копирования)

### Backend на Render:

```env
DATABASE_URL=[из PostgreSQL Internal URL]
NODE_ENV=production
BOT_TOKEN=8003396192:AAG8HulBW7CQa25gIgkfqZ-9UZYzjLcp-OA
ADMIN_TELEGRAM_IDS=609464085
PORT=3001
FRONTEND_URL=[из Frontend URL]
```

### Frontend на Render:

```env
VITE_API_URL=[Backend URL]/api
```

---

## 💻 Команды для терминала

### Инициализация БД (на Render Shell или локально):
```bash
npm run init-db
```

### Локальная разработка:
```bash
npm run dev          # Запуск backend + frontend
npm run dev:server   # Только backend
npm run dev:client   # Только frontend
```

### Git команды:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin [URL]
git push -u origin main
```

### Проверка подключения к БД (локально):
```bash
psql -h [host] -U [user] -d [database]
```

---

## 📊 API Endpoints (для тестирования)

### Базовый URL:
```
Local: http://localhost:3001/api
Production: https://your-backend.onrender.com/api
```

### Основные endpoints:

#### Health Check:
```
GET /health
→ {"status": "ok"}
```

#### Пользователи:
```
GET /api/users/me              - Мой профиль
GET /api/users/leaderboard     - Рейтинг
GET /api/users/stats           - Моя статистика
```

#### Игры:
```
GET /api/games                 - Все игры
GET /api/games/:id             - Игра по ID
POST /api/games/:id/register   - Регистрация
DELETE /api/games/:id/register - Отмена
```

#### Турниры:
```
GET /api/tournaments           - Все турниры
GET /api/tournaments/:id       - Турнир по ID
```

---

## 🔍 Проверка работы

### 1. Backend работает:
```
Откройте: https://your-backend.onrender.com
Должен вернуть JSON с информацией об API
```

### 2. БД инициализирована:
```
Логи должны показать:
✅ Schema created successfully
✅ Initial data seeded successfully
```

### 3. Frontend работает:
```
Откройте: https://your-frontend.onrender.com
Должна загрузиться страница приложения
```

### 4. Telegram бот настроен:
```
Откройте бота → Menu → Должно открыться приложение
```

---

## 🐛 Частые проблемы и решения

### Backend не запускается:
```
✓ Проверьте Environment Variables
✓ DATABASE_URL должен быть Internal (не External)
✓ Проверьте логи на Render Dashboard
✓ Попробуйте Manual Deploy
```

### База данных пустая:
```
✓ Запустите npm run init-db в Shell на Render
✓ Или локально с правильным DATABASE_URL
```

### CORS ошибки:
```
✓ FRONTEND_URL в backend должен совпадать с реальным URL
✓ Без trailing slash (/)
✓ С https://
```

### Frontend не загружается:
```
✓ VITE_API_URL должен быть правильным
✓ Backend должен работать
✓ Проверьте Console в браузере (F12)
```

### Telegram бот не открывается:
```
✓ URL в Menu Button должен быть правильным
✓ Frontend должен быть deployed
✓ Попробуйте переоткрыть бота
```

---

## 📁 Структура файлов проекта

```
poker-club-telegram-app/
│
├── 📄 START-HERE.md          ← Начните здесь!
├── 📄 DEPLOY-GUIDE.md        ← Подробная инструкция
├── 📄 RENDER-CONFIG.md       ← Готовые настройки
├── 📄 QUICK-LINKS.md         ← Этот файл
├── 📄 README.md              ← Техническая документация
│
├── 📁 server/                ← Backend код
│   ├── database/            ← База данных
│   ├── models/              ← Модели
│   ├── routes/              ← API
│   └── index.js             ← Главный файл
│
├── 📁 client/                ← Frontend код
│   └── src/
│       ├── components/      ← React компоненты
│       ├── hooks/           ← Custom hooks
│       └── lib/             ← API + Telegram SDK
│
├── 📝 env-server-READY.txt   ← Конфиг для backend
└── 📝 client/env-client-READY.txt ← Конфиг для frontend
```

---

## ⏱️ Примерное время на каждый этап

```
1. Создание аккаунта на Render      → 5 минут
2. Создание PostgreSQL БД           → 3 минуты
3. Создание Backend                 → 10 минут
4. Инициализация БД                 → 2 минуты
5. Создание Frontend                → 8 минуты
6. Обновление CORS                  → 2 минуты
7. Настройка Telegram бота          → 3 минуты
8. Тестирование                     → 5 минут
─────────────────────────────────────────────
ИТОГО:                              ≈ 38 минут
```

---

## 📞 Где найти помощь

### В проекте:
- **START-HERE.md** - быстрый старт
- **DEPLOY-GUIDE.md** - подробная инструкция
- **RENDER-CONFIG.md** - готовые настройки
- **README.md** - техническая документация

### Online:
- Render Docs: https://render.com/docs
- Telegram Bot API: https://core.telegram.org/bots
- Node.js Docs: https://nodejs.org/docs
- React Docs: https://react.dev

### Логи и мониторинг:
- Render Dashboard → Logs (для backend)
- Render Dashboard → Events (для всех сервисов)
- Browser Console (F12) - для frontend ошибок

---

## 🎯 Checklist перед запуском

### GitHub:
- [ ] Репозиторий создан
- [ ] Код запушен
- [ ] .gitignore настроен

### Render:
- [ ] Аккаунт создан
- [ ] PostgreSQL создан
- [ ] Internal Database URL скопирован
- [ ] Backend deployed
- [ ] БД инициализирована
- [ ] Frontend deployed
- [ ] CORS обновлен

### Telegram:
- [ ] Бот создан через BotFather
- [ ] Menu Button настроен
- [ ] URL правильный

### Тестирование:
- [ ] Backend открывается
- [ ] Frontend открывается
- [ ] Бот открывает приложение
- [ ] Данные загружаются

---

## 🚀 Следующие шаги после запуска

### 1. Добавьте контент:
- Создайте реальные игры через админ-панель
- Добавьте турниры
- Настройте описания

### 2. Кастомизация:
- Измените логотип
- Настройте цвета (в Tailwind)
- Добавьте информацию о клубе

### 3. Пригласите пользователей:
- Поделитесь ботом
- Создайте Telegram группу
- Анонсируйте игры

### 4. Мониторинг:
- Следите за логами на Render
- Проверяйте метрики использования
- Делайте backup БД

---

**Все готово! Начинайте с START-HERE.md и вперед! 🎉**

