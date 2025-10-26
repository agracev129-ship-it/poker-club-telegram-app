# 🚀 ПОДРОБНАЯ ИНСТРУКЦИЯ ПО ДЕПЛОЮ НА RENDER

## 📋 Ваши данные уже настроены:
- ✅ Telegram Bot Token: `8003396192:AAG8HulBW7CQa25gIgkfqZ-9UZYzjLcp-OA`
- ✅ Telegram User ID (Admin): `609464085`

## 🎯 Что мы будем делать:
1. Создадим базу данных PostgreSQL на Render
2. Создадим backend сервер на Render
3. Создадим frontend на Render
4. Настроим Telegram бота
5. Запустим приложение!

---

## ЭТАП 1: Создание аккаунта на Render

### Шаг 1.1: Регистрация
1. Откройте https://render.com
2. Нажмите **Sign Up** (или **Get Started**)
3. Выберите способ регистрации:
   - Через GitHub (рекомендуется)
   - Через Google
   - Через Email
4. Подтвердите email (если нужно)

### Шаг 1.2: Верификация (может потребоваться)
- Render может попросить привязать банковскую карту
- Не переживайте - **бесплатный план останется бесплатным**
- Это только для верификации аккаунта

---

## ЭТАП 2: Создание базы данных PostgreSQL

### Шаг 2.1: Создание БД

1. В Dashboard Render нажмите **New +** (в правом верхнем углу)
2. Выберите **PostgreSQL**

### Шаг 2.2: Настройка БД

Заполните форму:
```
Name: poker-club-db
Database: poker_club
User: (оставьте как есть - создастся автоматически)
Region: Frankfurt (EU Central) - или ближайший к вам
PostgreSQL Version: 16 (или последняя доступная)
Datadog API Key: (оставьте пустым)
Plan Type: Free
```

### Шаг 2.3: Создание

1. Нажмите **Create Database**
2. Подождите 1-2 минуты, пока БД создается
3. После создания вы увидите статус "Available"

### Шаг 2.4: Получение Connection String

**ВАЖНО!** Скопируйте **Internal Database URL** (не External!)

1. На странице вашей БД найдите раздел **Connections**
2. Найдите **Internal Database URL**
3. Он выглядит примерно так:
   ```
   postgresql://poker_club_user:xxxxxxxxxxxxx@dpg-xxxxxxxxxxxxx/poker_club
   ```
4. **СКОПИРУЙТЕ ЕГО ПОЛНОСТЬЮ** - он понадобится!

---

## ЭТАП 3: Подготовка кода (Git)

### Вариант A: Если у вас уже есть GitHub репозиторий

Просто убедитесь, что код запушен:
```bash
cd C:\Users\grach\source\repos\NBKapp\poker-club-telegram-app
git add .
git commit -m "Ready for deploy"
git push
```

### Вариант B: Если НЕТ GitHub репозитория (создадим новый)

#### Шаг 3.1: Создайте репозиторий на GitHub

1. Откройте https://github.com
2. Нажмите **New repository** (зеленая кнопка)
3. Заполните:
   ```
   Repository name: poker-club-app
   Description: Telegram Mini App для покерного клуба
   Public/Private: (на ваш выбор)
   ❌ НЕ добавляйте README, .gitignore, license
   ```
4. Нажмите **Create repository**

#### Шаг 3.2: Загрузите код на GitHub

Откройте PowerShell в папке проекта:

```powershell
cd C:\Users\grach\source\repos\NBKapp\poker-club-telegram-app

# Инициализируем git (если еще не сделано)
git init

# Добавляем .gitignore
echo "node_modules/
client/node_modules/
.env
.env.local
dist/
build/
client/dist/
*.log" > .gitignore

# Добавляем все файлы
git add .

# Делаем первый коммит
git commit -m "Initial commit - Poker Club Telegram Mini App"

# Подключаем к GitHub (ЗАМЕНИТЕ на ваш URL из шага 3.1)
git remote add origin https://github.com/YOUR-USERNAME/poker-club-app.git

# Пушим код
git branch -M main
git push -u origin main
```

**ВАЖНО:** Замените `YOUR-USERNAME` на ваше имя пользователя GitHub!

---

## ЭТАП 4: Создание Backend на Render

### Шаг 4.1: Создание Web Service

1. В Dashboard Render нажмите **New +**
2. Выберите **Web Service**
3. Выберите **Build and deploy from a Git repository**
4. Нажмите **Next**

### Шаг 4.2: Подключение репозитория

1. Если GitHub еще не подключен:
   - Нажмите **Connect GitHub**
   - Авторизуйте Render
2. Выберите репозиторий **poker-club-app** (или как вы его назвали)
3. Нажмите **Connect**

### Шаг 4.3: Настройка Backend

Заполните форму:

```
Name: poker-club-backend
Region: Frankfurt (EU Central) - тот же, что и БД!
Branch: main
Root Directory: (оставьте пустым)
Runtime: Node
Build Command: npm install
Start Command: node server/index.js
Plan Type: Free
```

### Шаг 4.4: Environment Variables (САМОЕ ВАЖНОЕ!)

Прокрутите вниз до раздела **Environment Variables** и добавьте:

1. **Нажмите "Add Environment Variable"** и добавьте каждую переменную:

```
Key: DATABASE_URL
Value: [вставьте Internal Database URL из Шага 2.4]
```

```
Key: NODE_ENV
Value: production
```

```
Key: BOT_TOKEN
Value: 8003396192:AAG8HulBW7CQa25gIgkfqZ-9UZYzjLcp-OA
```

```
Key: ADMIN_TELEGRAM_IDS
Value: 609464085
```

```
Key: PORT
Value: 3001
```

```
Key: FRONTEND_URL
Value: https://temporary.com
```
(Мы обновим это после создания frontend)

### Шаг 4.5: Создание Backend

1. Нажмите **Create Web Service**
2. Подождите 3-5 минут, пока идет деплой
3. Следите за логами в реальном времени
4. Когда увидите "Your service is live 🎉" - backend готов!

### Шаг 4.6: Скопируйте URL Backend

В верхней части страницы вы увидите URL:
```
https://poker-club-backend-xxxx.onrender.com
```

**СКОПИРУЙТЕ ЕГО!** Он понадобится для frontend и инициализации БД.

### Шаг 4.7: Инициализация базы данных

**ВАЖНО!** Нужно создать таблицы в БД:

1. На странице вашего backend сервиса найдите **Shell** (в меню слева)
2. Нажмите на него - откроется терминал
3. Выполните команду:
   ```bash
   npm run init-db
   ```
4. Дождитесь сообщений:
   ```
   ✅ Schema created successfully
   ✅ Initial data seeded successfully
   🎉 Database initialization completed!
   ```

Если команда не работает в Shell, можно сделать локально:

```powershell
# В вашей локальной папке проекта
cd C:\Users\grach\source\repos\NBKapp\poker-club-telegram-app

# Временно установите DATABASE_URL
$env:DATABASE_URL="[вставьте Internal Database URL]"

# Запустите инициализацию
npm run init-db
```

---

## ЭТАП 5: Создание Frontend на Render

### Шаг 5.1: Создание Static Site

1. В Dashboard Render нажмите **New +**
2. Выберите **Static Site**
3. Выберите тот же репозиторий **poker-club-app**
4. Нажмите **Connect**

### Шаг 5.2: Настройка Frontend

Заполните форму:

```
Name: poker-club-frontend
Branch: main
Root Directory: (оставьте пустым)
Build Command: cd client && npm install && npm run build
Publish Directory: client/dist
Plan Type: Free
```

### Шаг 5.3: Environment Variables для Frontend

Добавьте одну переменную:

```
Key: VITE_API_URL
Value: [URL вашего backend из Шага 4.6]/api
```

Например:
```
VITE_API_URL = https://poker-club-backend-xxxx.onrender.com/api
```

### Шаг 5.4: Создание Frontend

1. Нажмите **Create Static Site**
2. Подождите 3-5 минут
3. Frontend будет готов!

### Шаг 5.5: Скопируйте URL Frontend

```
https://poker-club-frontend-xxxx.onrender.com
```

**СКОПИРУЙТЕ ЕГО!**

---

## ЭТАП 6: Обновление Backend CORS

### Шаг 6.1: Обновите FRONTEND_URL

1. Вернитесь к вашему **Backend** сервису на Render
2. Перейдите в **Environment** (в меню слева)
3. Найдите переменную `FRONTEND_URL`
4. Нажмите **Edit**
5. Замените значение на URL frontend из Шага 5.5:
   ```
   https://poker-club-frontend-xxxx.onrender.com
   ```
6. Нажмите **Save Changes**
7. Backend автоматически перезапустится (займет 1-2 минуты)

---

## ЭТАП 7: Настройка Telegram Бота

### Шаг 7.1: Настройка Web App

1. Откройте Telegram
2. Найдите [@BotFather](https://t.me/botfather)
3. Отправьте команду:
   ```
   /mybots
   ```
4. Выберите вашего бота
5. Нажмите **Bot Settings**
6. Нажмите **Menu Button**
7. Выберите **Configure Menu Button**
8. Отправьте:
   - **Button text:** `Открыть клуб` или `Играть`
   - **URL:** [вставьте URL frontend из Шага 5.5]
     ```
     https://poker-club-frontend-xxxx.onrender.com
     ```

### Шаг 7.2: Настройка описания (опционально)

```
/setdescription
- Выберите бота
- Введите описание:
  "Покерный клуб - регистрация на игры, турниры, рейтинг игроков"

/setabouttext
- Выберите бота
- Введите текст:
  "Добро пожаловать в покерный клуб! Регистрируйтесь на игры и турниры."

/setcommands
- Выберите бота
- Введите:
  start - Запустить приложение
  help - Помощь
```

---

## ЭТАП 8: Тестирование!

### Шаг 8.1: Откройте бота

1. Найдите вашего бота в Telegram (по username)
2. Нажмите **Start** или **/start**
3. Нажмите на кнопку Menu (или кнопку "Открыть клуб")

### Шаг 8.2: Проверка

✅ Приложение должно открыться  
✅ Вы должны увидеть главную страницу  
✅ Ваше имя должно отображаться вверху  
✅ Игры должны загрузиться (8 игр из БД)  
✅ Вы можете регистрироваться на игры  
✅ Рейтинг должен работать  
✅ Профиль должен показывать ваши данные  

---

## 🎉 ГОТОВО!

Ваше приложение работает на:
- **Backend:** https://poker-club-backend-xxxx.onrender.com
- **Frontend:** https://poker-club-frontend-xxxx.onrender.com
- **База данных:** PostgreSQL на Render
- **Telegram Bot:** Готов к использованию!

---

## 📊 Проверка работы через Render Dashboard

### Проверка Backend:

1. Откройте ваш backend на Render
2. Перейдите в **Logs** - должны видеть:
   ```
   🚀 Server running on port 3001
   ✅ Connected to PostgreSQL database
   ```
3. Откройте URL backend в браузере:
   ```
   https://poker-club-backend-xxxx.onrender.com
   ```
   Должны увидеть JSON:
   ```json
   {
     "message": "Poker Club Telegram Mini App API",
     "version": "1.0.0"
   }
   ```

### Проверка Frontend:

1. Откройте URL frontend в браузере
2. Должно открыться приложение (но авторизация работает только в Telegram!)

### Проверка БД:

1. Откройте вашу БД на Render
2. Перейдите в **Connection**
3. Используйте любой PostgreSQL клиент (DBeaver, pgAdmin) для подключения
4. Проверьте таблицы - должно быть 9 таблиц с данными

---

## 🔧 Если что-то не работает

### Backend не запускается:

1. Проверьте **Logs** на странице backend
2. Убедитесь, что все Environment Variables правильно настроены
3. Проверьте, что DATABASE_URL - это Internal URL (не External!)
4. Попробуйте Manual Deploy: нажмите **Manual Deploy** → **Deploy latest commit**

### Frontend показывает ошибки:

1. Проверьте, что `VITE_API_URL` правильно настроен
2. Убедитесь, что backend работает
3. Проверьте Console в браузере (F12) на ошибки CORS

### База данных пустая:

1. Запустите `npm run init-db` еще раз через Shell на Render
2. Или запустите локально с правильным DATABASE_URL

### Telegram бот не открывает приложение:

1. Проверьте, что URL в Menu Button правильный
2. Убедитесь, что frontend deployed и работает
3. Попробуйте открыть URL напрямую в браузере

---

## 📱 Дополнительные настройки

### Добавление других администраторов:

1. Получите Telegram ID других админов через @userinfobot
2. Обновите `ADMIN_TELEGRAM_IDS` на Render:
   ```
   609464085,123456789,987654321
   ```
   (через запятую)

### Обновление приложения:

```bash
# Внесите изменения в код
# Закоммитьте и запушьте на GitHub
git add .
git commit -m "Update"
git push

# Render автоматически задеплоит новую версию!
```

### Monitoring:

- Следите за логами на Render Dashboard
- Проверяйте метрики (CPU, Memory)
- На бесплатном плане backend "засыпает" через 15 минут неактивности

---

## 💰 Важно о бесплатном плане Render

### Ограничения:
- Backend: 750 часов в месяц (достаточно для тестирования)
- Static Site: Без ограничений
- PostgreSQL: 90 дней бесплатно, потом нужно продлить или перейти на платный план
- Backend "засыпает" при неактивности и просыпается при первом запросе (30-60 сек)

### Рекомендации:
- Для production лучше использовать платный план ($7/месяц)
- Регулярно делайте backup БД
- Мониторьте usage на Dashboard

---

## 🎓 Полезные ссылки

- Render Dashboard: https://dashboard.render.com
- Render Docs: https://render.com/docs
- Telegram Bot API: https://core.telegram.org/bots/api
- Telegram Web Apps: https://core.telegram.org/bots/webapps
- PostgreSQL Docs: https://www.postgresql.org/docs/

---

## 📞 Нужна помощь?

1. Проверьте логи на Render Dashboard
2. Проверьте все Environment Variables
3. Убедитесь, что БД инициализирована
4. Проверьте CORS настройки

---

**Ваше приложение готово! Приглашайте пользователей и наслаждайтесь! 🎰♠️♥️♦️♣️**

