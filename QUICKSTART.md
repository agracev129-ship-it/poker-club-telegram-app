# 🚀 Быстрый старт

## Для локальной разработки

### 1. Установка PostgreSQL (если еще не установлен)

**Windows:**
- Скачайте и установите с https://www.postgresql.org/download/windows/
- Создайте базу данных:
```sql
CREATE DATABASE poker_club;
```

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
createdb poker_club
```

**Linux:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb poker_club
```

### 2. Быстрая настройка

```bash
# Клонируйте или перейдите в папку проекта
cd poker-club-telegram-app

# Установите зависимости backend
npm install

# Установите зависимости frontend
cd client
npm install
cd ..

# Создайте файл .env в корне проекта
echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/poker_club
PORT=3001
NODE_ENV=development
BOT_TOKEN=your_bot_token
ADMIN_TELEGRAM_IDS=your_telegram_id
FRONTEND_URL=http://localhost:3000" > .env

# Создайте файл client/.env
echo "VITE_API_URL=http://localhost:3001/api" > client/.env

# Инициализируйте базу данных
npm run init-db

# Запустите приложение
npm run dev
```

Приложение откроется на:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Для деплоя на Render (Production)

### Шаг 1: Подготовка репозитория

```bash
# Инициализируйте git репозиторий (если еще не сделано)
git init
git add .
git commit -m "Initial commit"

# Создайте репозиторий на GitHub и запушьте код
git remote add origin https://github.com/your-username/poker-club-app.git
git push -u origin main
```

### Шаг 2: Создание PostgreSQL на Render

1. Зайдите на https://render.com
2. Создайте аккаунт/войдите
3. Нажмите **New +** → **PostgreSQL**
4. Настройте:
   - Name: `poker-club-db`
   - Database: `poker_club`
   - User: (автоматически)
   - Region: выберите ближайший
   - Plan: Free
5. Нажмите **Create Database**
6. **Скопируйте Internal Database URL** (потребуется для backend)

### Шаг 3: Создание Backend на Render

1. Нажмите **New +** → **Web Service**
2. Подключите ваш GitHub репозиторий
3. Настройте:
   - Name: `poker-club-backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node server/index.js`
4. Добавьте Environment Variables:
   ```
   DATABASE_URL = [вставьте Internal Database URL из шага 2]
   NODE_ENV = production
   BOT_TOKEN = [ваш Telegram bot token]
   ADMIN_TELEGRAM_IDS = [ваши Telegram IDs через запятую]
   FRONTEND_URL = [будет добавлено после деплоя frontend]
   ```
5. Нажмите **Create Web Service**
6. После деплоя откройте Shell на Render и выполните:
   ```bash
   npm run init-db
   ```
7. **Скопируйте URL вашего backend** (например, https://poker-club-backend.onrender.com)

### Шаг 4: Создание Frontend на Render

1. Нажмите **New +** → **Static Site**
2. Подключите тот же GitHub репозиторий
3. Настройте:
   - Name: `poker-club-frontend`
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/dist`
4. Добавьте Environment Variables:
   ```
   VITE_API_URL = [URL backend из шага 3]/api
   ```
   Например: `https://poker-club-backend.onrender.com/api`
5. Нажмите **Create Static Site**
6. **Скопируйте URL вашего frontend** (например, https://poker-club-frontend.onrender.com)

### Шаг 5: Обновите Backend Environment

1. Вернитесь к настройкам Backend на Render
2. Обновите переменную `FRONTEND_URL` на URL из шага 4
3. Сохраните (сервис перезапустится автоматически)

### Шаг 6: Настройка Telegram Bot

1. Найдите [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте `/newbot` и следуйте инструкциям
3. Скопируйте Bot Token и добавьте его в Backend Environment Variables
4. Настройте Web App:
   ```
   /setmenubutton
   - Выберите вашего бота
   - Введите название кнопки: "Открыть клуб"
   - Введите URL: [URL frontend из шага 4]
   ```
5. Также можно настроить описание и команды:
   ```
   /setdescription - Установите описание бота
   /setabouttext - Установите текст "О боте"
   ```

### Шаг 7: Получите ваш Telegram ID

1. Напишите боту [@userinfobot](https://t.me/userinfobot)
2. Скопируйте ваш ID
3. Добавьте его в `ADMIN_TELEGRAM_IDS` в Backend Environment Variables на Render

### Шаг 8: Тестирование

1. Откройте вашего бота в Telegram
2. Нажмите Menu или отправьте `/start`
3. Приложение должно открыться!

## 🎉 Готово!

Ваше Telegram Mini App для покерного клуба теперь работает!

### Что дальше?

- Настройте дизайн под свой клуб (логотипы, цвета)
- Добавьте реальные игры и турниры через админ-панель
- Пригласите пользователей
- Мониторьте статистику и рейтинги

### Полезные ссылки

- Render Dashboard: https://dashboard.render.com
- Telegram Bot API: https://core.telegram.org/bots/api
- Telegram Web Apps: https://core.telegram.org/bots/webapps

### Поддержка

Если что-то не работает:
1. Проверьте логи на Render Dashboard
2. Убедитесь, что все Environment Variables правильно настроены
3. Проверьте, что база данных инициализирована (`npm run init-db`)
4. Проверьте CORS настройки (FRONTEND_URL должен совпадать с реальным URL)

## 💡 Советы

### Бесплатный план Render

- Backend может "засыпать" при отсутствии активности (15 минут)
- Первый запрос после сна может занять 30-60 секунд
- Для production рекомендуется платный план

### Тестирование локально как Telegram Mini App

1. Используйте ngrok для публичного URL:
   ```bash
   ngrok http 3000
   ```
2. Настройте bot menu с ngrok URL
3. Теперь можно тестировать из Telegram

### Backup базы данных

Регулярно делайте backup на Render:
1. Зайдите в PostgreSQL сервис
2. Перейдите в Connect
3. Используйте `pg_dump` для создания backup

