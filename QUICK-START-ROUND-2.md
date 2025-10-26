# ⚡ Быстрый Старт - Раунд 2

## Что исправлено:
✅ Кнопка регистрации на турниры теперь обновляется корректно  
✅ Вкладка "Игроки" теперь работает (исправлена маршрутизация API)

---

## 🚀 Что делать СЕЙЧАС (5 шагов):

### 1️⃣ Создать файл .env (если еще нет)
Папка: `c:\Users\grach\source\repos\NBKapp\poker-club-telegram-app\client`  
Имя файла: `.env`  
Содержимое:
```
VITE_API_URL=https://poker-club-backend-tb4h.onrender.com/api
```

### 2️⃣ Пересобрать проект
```powershell
cd c:\Users\grach\source\repos\NBKapp\poker-club-telegram-app\client
npm run build
```

### 3️⃣ Загрузить на GitHub
**GitHub Desktop:**
- Summary: `Fix tournament registration button and players API routing`
- Commit to main → Push origin

### 4️⃣ Проверить переменную окружения на Render
**Frontend сервис** → Environment → Проверить:
- `VITE_API_URL` = `https://poker-club-backend-tb4h.onrender.com/api`

### 5️⃣ **ВАЖНО!** Инициализировать таблицу друзей
**Backend сервис** → Shell → Выполнить:
```bash
node init-friends-table.js
```
**Только один раз!**

---

## ✅ Проверка:
1. **Турниры:** Кнопка меняется после регистрации/отмены
2. **Посадка:** Показывает стол и место после регистрации
3. **Игроки:** Отображает список всех пользователей

---

## 🆘 Если не работает:
См. `FIXES-ROUND-2.md` → раздел "Диагностика проблем"

