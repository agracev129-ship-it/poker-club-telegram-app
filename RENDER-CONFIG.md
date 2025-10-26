# 📝 ГОТОВЫЕ НАСТРОЙКИ ДЛЯ RENDER

## ✅ Ваши данные уже настроены:

```
Telegram Bot Token: 8003396192:AAG8HulBW7CQa25gIgkfqZ-9UZYzjLcp-OA
Telegram User ID: 609464085
```

---

## 🔧 Environment Variables для BACKEND на Render

Когда создаете Web Service на Render, добавьте эти переменные:

### 1. DATABASE_URL
```
[Вставьте Internal Database URL из вашей PostgreSQL БД на Render]
Пример: postgresql://poker_club_user:xxxxx@dpg-xxxxx-fra1/poker_club
```

### 2. NODE_ENV
```
production
```

### 3. BOT_TOKEN
```
8003396192:AAG8HulBW7CQa25gIgkfqZ-9UZYzjLcp-OA
```

### 4. ADMIN_TELEGRAM_IDS
```
609464085
```

### 5. PORT
```
3001
```

### 6. FRONTEND_URL
```
[Вставьте сюда URL вашего frontend после его создания]
Пример: https://poker-club-frontend-xxxx.onrender.com
```

---

## 🎨 Environment Variables для FRONTEND на Render

Когда создаете Static Site на Render, добавьте эту переменную:

### VITE_API_URL
```
[Вставьте URL вашего backend + /api]
Пример: https://poker-club-backend-xxxx.onrender.com/api
```

---

## 📋 Build Settings для BACKEND

```
Name: poker-club-backend
Region: Frankfurt (EU Central)
Branch: main
Root Directory: (оставьте пустым)
Runtime: Node
Build Command: npm install
Start Command: node server/index.js
Plan Type: Free
```

---

## 📋 Build Settings для FRONTEND

```
Name: poker-club-frontend
Branch: main
Root Directory: (оставьте пустым)
Build Command: cd client && npm install && npm run build
Publish Directory: client/dist
Plan Type: Free
```

---

## 🗄️ PostgreSQL Settings

```
Name: poker-club-db
Database: poker_club
User: (автоматически)
Region: Frankfurt (EU Central)
PostgreSQL Version: 16
Plan Type: Free
```

---

## ⚡ Быстрая последовательность действий:

1. **Создать PostgreSQL** → Скопировать Internal Database URL
2. **Создать Backend** → Добавить все Environment Variables
3. **Инициализировать БД** → `npm run init-db` в Shell
4. **Скопировать Backend URL**
5. **Создать Frontend** → Добавить VITE_API_URL
6. **Скопировать Frontend URL**
7. **Обновить Backend** → Изменить FRONTEND_URL
8. **Настроить Telegram Bot** → Добавить Web App URL
9. **Готово!** 🎉

---

## 🔍 Как найти URLs:

### Internal Database URL:
```
Render Dashboard → PostgreSQL → Connections → Internal Database URL
Копируйте ИМЕННО Internal (не External!)
```

### Backend URL:
```
Render Dashboard → Web Service (backend) → 
URL показан вверху страницы
Пример: https://poker-club-backend-abcd.onrender.com
```

### Frontend URL:
```
Render Dashboard → Static Site → 
URL показан вверху страницы
Пример: https://poker-club-frontend-xyz.onrender.com
```

---

## ✅ Проверка правильности настроек

### Backend должен показать:
```json
{
  "message": "Poker Club Telegram Mini App API",
  "version": "1.0.0",
  "endpoints": {
    "users": "/api/users",
    "games": "/api/games",
    "tournaments": "/api/tournaments"
  }
}
```

### В логах Backend должно быть:
```
🚀 Server running on port 3001
✅ Connected to PostgreSQL database
📱 Environment: production
🌐 CORS enabled for: [ваш frontend URL]
```

### После инициализации БД:
```
✅ Schema created successfully
✅ Initial data seeded successfully
🎉 Database initialization completed!
```

---

## 🎯 Telegram Bot Menu Button

```
URL для кнопки Menu: [Frontend URL]
Пример: https://poker-club-frontend-xyz.onrender.com

Настройка через @BotFather:
/setmenubutton
→ Выберите бота
→ Button text: Открыть клуб
→ URL: [вставьте Frontend URL]
```

---

**Все готово для деплоя! Следуйте инструкциям в DEPLOY-GUIDE.md** 🚀

