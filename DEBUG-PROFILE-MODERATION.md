# 🔍 Отладка модерации профилей

## Что сделано:

✅ Добавлено детальное логирование на:
- Backend (server/routes/profile-requests.js)
- Frontend (client/src/components/ProfileEditView.tsx)
- API Client (client/src/lib/api.ts)

---

## 📋 Как проверить что происходит:

### Шаг 1: Задеплойте изменения

```bash
# Коммит
git add .
git commit -m "Debug: добавлено логирование для модерации профилей"
git push origin main

# Render автоматически задеплоит
```

### Шаг 2: Откройте консоль браузера

1. **Откройте приложение в Telegram**
2. **Нажмите F12 (или правой кнопкой → "Inspect")**
3. **Перейдите во вкладку "Console"**
4. **Очистите консоль (кнопка 🚫 или Ctrl+L)**

### Шаг 3: Попробуйте изменить профиль

1. **Профиль → Кнопка ✏️**
2. **Введите новое имя**
3. **Нажмите "Отправить на модерацию"**
4. **СМОТРИТЕ В КОНСОЛЬ!**

### Шаг 4: Анализ логов в консоли браузера

Вы должны увидеть логи в следующем порядке:

```
=== Profile Edit Submit Started ===
User: {id: 1, telegram_id: 123456, ...}
Current name: "Иван Иванов"
Requested name: "Иван Pro"
...

=== API Request ===
Endpoint: /profile-requests
Method: POST
Has initData: true
Request body: {"currentName":"Иван Иванов","requestedName":"Иван Pro",...}

Response status: 201
Response data: {id: 1, user_id: 1, ...}

Request created successfully: {id: 1, ...}
```

### Шаг 5: Проверьте логи backend

1. **Откройте Render Dashboard**
2. **Ваш backend сервис → Logs**
3. **Найдите логи во время отправки запроса**

Вы должны увидеть:

```
=== Profile Request Creation Started ===
Request body: { currentName: 'Иван Иванов', requestedName: 'Иван Pro', ... }
Telegram user: 123456
User from middleware: 1
Using req.user.id: 1
Creating profile request with: { userId: 1, currentName: 'Иван Иванов', ... }
Profile request created successfully: 1
```

---

## 🐛 Возможные проблемы и их решения:

### Проблема 1: В консоли браузера ошибка "Network error"

**Причина:** Неправильный API_URL

**Решение:**
1. Проверьте переменную окружения `VITE_API_URL` в Render
2. Убедитесь что backend доступен
3. Проверьте что нет CORS ошибок

### Проблема 2: В консоли "Has initData: false"

**Причина:** Приложение запущено не в Telegram

**Решение:**
1. Обязательно открывайте через Telegram Mini App
2. Не тестируйте в обычном браузере

### Проблема 3: Backend логи: "User not found for telegram_id"

**Причина:** Пользователь не зарегистрирован в БД

**Решение:**
1. Сначала откройте главную страницу приложения
2. Подождите пока загрузится профиль
3. Потом пробуйте изменить имя

### Проблема 4: Backend логи: "No changes provided"

**Причина:** На backend не пришли данные

**Решение:**
1. Проверьте что `requestedName` не пустой
2. Проверьте что имя отличается от текущего
3. Смотрите логи frontend что отправляется

### Проблема 5: Response status: 403

**Причина:** Пользователь заблокирован или нет прав

**Решение:**
1. Проверьте что пользователь не заблокирован
2. Проверьте middleware в backend

### Проблема 6: Response status: 500

**Причина:** Ошибка на сервере (скорее всего БД)

**Решение:**
1. Смотрите backend логи для деталей
2. Проверьте что в таблице `users` есть поле `name`
3. Проверьте что таблица `profile_change_requests` создана

---

## 🔧 Проверка базы данных

### Проверка что поле `name` существует:

```sql
-- В Render Dashboard → PostgreSQL → Connect
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

Должны увидеть:
```
column_name       | data_type         | is_nullable
------------------|-------------------|------------
id                | integer           | NO
telegram_id       | bigint            | NO
username          | varchar(255)      | YES
first_name        | varchar(255)      | YES
last_name         | varchar(255)      | YES
name              | varchar(255)      | YES  ← ДОЛЖНО БЫТЬ!
photo_url         | text              | YES
is_admin          | boolean           | YES
is_blocked        | boolean           | YES
created_at        | timestamp         | YES
last_active       | timestamp         | YES
```

### Проверка таблицы profile_change_requests:

```sql
-- Проверить что таблица существует
SELECT * FROM profile_change_requests LIMIT 1;
```

Если ошибка "relation does not exist":
```sql
-- Создать таблицу вручную
CREATE TABLE IF NOT EXISTS profile_change_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_name VARCHAR(255) NOT NULL,
  current_avatar_url TEXT,
  requested_name VARCHAR(255),
  requested_avatar_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Проверка пользователей:

```sql
-- Посмотреть пользователей и их имена
SELECT id, telegram_id, first_name, last_name, name, is_blocked
FROM users
ORDER BY id DESC
LIMIT 10;
```

---

## 📸 Скриншоты для отладки

Сделайте скриншоты:

1. **Консоль браузера** с полным логом
2. **Backend логи** в Render во время отправки
3. **Форма изменения профиля** (что вводите)
4. **Что происходит после нажатия кнопки**

---

## 🚨 Если ничего не помогает

### Тест 1: Проверка endpoint напрямую

Используйте Postman или curl:

```bash
# Получить ваш initData из Telegram
# В консоли браузера выполните:
console.log(window.Telegram.WebApp.initData);

# Затем отправьте запрос:
curl -X POST https://your-backend.onrender.com/api/profile-requests \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Init-Data: ваш_init_data" \
  -d '{
    "currentName": "Test User",
    "requestedName": "New Name"
  }'
```

### Тест 2: Проверка через SQL

```sql
-- Вставить запрос напрямую в БД
INSERT INTO profile_change_requests 
  (user_id, current_name, requested_name, status)
VALUES 
  (1, 'Test User', 'New Name', 'pending');

-- Проверить что вставилось
SELECT * FROM profile_change_requests 
WHERE user_id = 1
ORDER BY created_at DESC;
```

### Тест 3: Временно отключить checkUserBlocked

Если проблема в middleware, временно уберите его:

```javascript
// В profile-requests.js
// ВРЕМЕННО для теста
router.post('/', authenticateTelegram, /* checkUserBlocked, */ async (req, res) => {
  // ...
});
```

---

## 📞 Что мне сообщить

После тестирования отправьте:

1. **Логи из консоли браузера** (текстом или скриншот)
2. **Логи из Render backend** (во время отправки запроса)
3. **Результат SQL запросов** (проверка таблиц)
4. **Что происходит визуально** (описание или видео)

---

## ✅ Ожидаемый результат

После всех исправлений должно быть:

1. ✅ В консоли браузера видны все этапы
2. ✅ API запрос отправляется с кодом 201
3. ✅ Backend создает запись в БД
4. ✅ Пользователь видит toast "Запрос отправлен"
5. ✅ Форма закрывается
6. ✅ В админ панели появляется заявка

---

**Теперь задеплойте изменения и пришлите логи! 🔍**

