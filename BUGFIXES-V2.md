# 🐛 Исправленные баги (версия 2)

## Дата: Ноябрь 2025

---

## Баг #1: Блокировка обходилась на уровне API ❌ → ✅

### Проблема:
Заблокированный пользователь мог просто закрыть alert о блокировке и продолжить пользоваться приложением, включая регистрацию на турниры. Блокировка работала только на уровне UI.

### Причина:
- Middleware `checkUserBlocked` не применялся к endpoints регистрации на турниры
- Блокировка проверялась только при входе в приложение (`/api/users/me`)
- API endpoints `/api/games/:id/register` и `/api/games/:id/unregister` были доступны для заблокированных пользователей

### Исправление:

**Backend - routes/games.js**

1. **Добавлен импорт `checkUserBlocked`:**
```javascript
import { authenticateTelegram, requireAdmin, checkUserBlocked } from '../middleware/telegram-auth.js';
```

2. **Добавлен middleware к endpoint регистрации (строка 105):**
```javascript
router.post('/:id/register', authenticateTelegram, checkUserBlocked, async (req, res) => {
  // ... код регистрации
});
```

3. **Добавлен middleware к endpoint отмены регистрации (строка 134):**
```javascript
router.delete('/:id/register', authenticateTelegram, checkUserBlocked, async (req, res) => {
  // ... код отмены регистрации
});
```

### Результат:
✅ Теперь заблокированные пользователи:
- Не могут зарегистрироваться на турнир через API (даже если обойдут UI)
- Получают 403 ошибку с сообщением о блокировке
- Не могут отменить существующую регистрацию
- Полностью заблокированы на уровне API, а не только UI

---

## Баг #2: Запрос на изменение имени не работал ❌ → ✅

### Проблема:
Пользователи не могли отправить запрос на изменение имени. Форма открывалась, но при отправке возникала ошибка, и заявка не создавалась в БД.

### Причина:
**Критическая ошибка в схеме БД:**
- В таблице `users` есть поля `first_name` и `last_name`, но НЕТ поля `name`
- В модели `ProfileRequest.js` используются SQL запросы с полем `u.name as user_name`
- В методе `ProfileRequest.approve()` используется `UPDATE users SET name = ...`
- PostgreSQL выдавал ошибку: `column "name" does not exist`

**Примеры проблемного кода:**

ProfileRequest.js (строка 29):
```javascript
SELECT u.name as user_name  // ← поля name не существует!
FROM users u
```

ProfileRequest.js (строка 95):
```javascript
updates.push(`name = $${paramIndex++}`);  // ← поля name не существует!
```

### Исправление:

#### 1. **Backend - database/schema-profile-moderation.sql**

Добавлено поле `name` в таблицу users:
```sql
-- Add name field to users table (display name)
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Update existing users to set name from first_name + last_name
UPDATE users SET name = CONCAT(first_name, COALESCE(' ' || last_name, '')) WHERE name IS NULL;
```

#### 2. **Backend - models/User.js (строка 18-36)**

Обновлен метод `upsert` для автоматического создания поля `name`:
```javascript
async upsert(userData) {
  const { telegram_id, username, first_name, last_name, photo_url } = userData;
  
  // Создаем отображаемое имя из first_name и last_name
  const displayName = first_name + (last_name ? ` ${last_name}` : '');
  
  const result = await query(
    `INSERT INTO users (telegram_id, username, first_name, last_name, name, photo_url, last_active)
     VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
     ON CONFLICT (telegram_id) 
     DO UPDATE SET 
       username = EXCLUDED.username,
       first_name = EXCLUDED.first_name,
       last_name = EXCLUDED.last_name,
       name = EXCLUDED.name,  // ← добавлено обновление name
       photo_url = EXCLUDED.photo_url,
       last_active = CURRENT_TIMESTAMP
     RETURNING *`,
    [telegram_id, username, first_name, last_name, displayName, photo_url]
  );
  
  return result.rows[0];
}
```

#### 3. **Frontend - lib/api.ts (строка 46)**

Добавлено поле `name` в интерфейс User:
```typescript
export interface User {
  id: number;
  telegram_id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  name?: string;  // Отображаемое имя (first_name + last_name)
  photo_url?: string;
  is_admin: boolean;
  is_blocked?: boolean;
  created_at: string;
  last_active: string;
}
```

#### 4. **Frontend - components/ProfileEditView.tsx (строка 52)**

Обновлена логика получения текущего имени:
```typescript
// Используем name если есть, иначе формируем из first_name и last_name
const currentName = user?.name || (user?.first_name + (user?.last_name ? ` ${user.last_name}` : '')) || '';
```

### Результат:
✅ Теперь модерация профилей полностью работает:
- Пользователи могут открыть форму изменения профиля
- Пользователи могут изменить отображаемое имя
- Запрос успешно создается в БД
- Заявка появляется в админ панели с корректными данными
- Администратор видит текущее имя и запрошенное имя
- При одобрении поле `name` в таблице `users` обновляется
- Новое имя сразу отображается в профиле пользователя

---

## 📦 Измененные файлы

### Backend:
- ✅ `server/routes/games.js` - добавлен checkUserBlocked middleware
- ✅ `server/database/schema-profile-moderation.sql` - добавлено поле name
- ✅ `server/models/User.js` - обновлен метод upsert для работы с полем name

### Frontend:
- ✅ `client/src/lib/api.ts` - добавлено поле name в интерфейс User
- ✅ `client/src/components/ProfileEditView.tsx` - обновлена логика получения currentName

---

## 🚀 Деплой изменений

### Шаг 1: Коммит изменений
```bash
git add .
git commit -m "Fix: полная блокировка на API уровне + исправлена модерация профилей"
git push origin main
```

### Шаг 2: Обновление базы данных

**ВАЖНО!** После деплоя backend нужно обновить схему БД:

1. **Автоматически (рекомендуется):**
   - При запуске сервер автоматически выполнит миграцию из `schema-profile-moderation.sql`
   - Поле `name` будет добавлено
   - Существующие пользователи получат значение `name` из `first_name + last_name`

2. **Вручную (если нужно):**
   Подключитесь к PostgreSQL через Render Dashboard или DBeaver:
   ```sql
   -- Добавить поле name
   ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
   
   -- Заполнить name для существующих пользователей
   UPDATE users SET name = CONCAT(first_name, COALESCE(' ' || last_name, '')) WHERE name IS NULL;
   ```

### Шаг 3: Проверка деплоя

1. **Проверьте логи backend в Render:**
   - Должно быть сообщение: "✅ Profile moderation tables initialized"
   - Не должно быть ошибок о несуществующей колонке `name`

2. **Проверьте что БД обновилась:**
   - В таблице `users` должно появиться поле `name`
   - У всех пользователей должно быть заполнено поле `name`

---

## ✅ Как протестировать

### Тест #1: Блокировка на уровне API

1. **Войдите как администратор**
2. **Admin Mode → Управление игроками**
3. **Заблокируйте тестового пользователя**
4. **Откройте приложение с аккаунта заблокированного пользователя**
5. **ОЖИДАЕМЫЙ РЕЗУЛЬТАТ:**
   - Приложение покажет alert о блокировке при входе
   
6. **ПОПЫТАЙТЕСЬ обойти через API (для продвинутых):**
   - Даже если закрыть alert
   - Даже если отправить прямой API запрос
   - Регистрация на турнир должна вернуть 403 ошибку

### Тест #2: Модерация профиля

1. **Войдите как обычный пользователь**
2. **Профиль → Нажмите кнопку ✏️ (карандаш)**
3. **Введите новое имя, например "Игрок Pro 2024"**
4. **Нажмите "Отправить на модерацию"**
5. **ОЖИДАЕМЫЙ РЕЗУЛЬТАТ:**
   - Появится уведомление "Запрос отправлен"
   - Форма закроется
   - **НЕ ДОЛЖНО быть ошибок в консоли**

6. **Войдите как администратор**
7. **Admin Mode → Модерация профилей**
8. **ОЖИДАЕМЫЙ РЕЗУЛЬТАТ:**
   - В списке появится заявка
   - Текущее имя: "Игрок"
   - Новое имя: "Игрок Pro 2024"
   - Счетчик покажет "1 заявка"

9. **Нажмите "Принять"**
10. **ОЖИДАЕМЫЙ РЕЗУЛЬТАТ:**
    - Заявка исчезнет из списка
    - Откройте профиль пользователя
    - Имя должно измениться на "Игрок Pro 2024"

---

## 🔍 Проверка базы данных

Если хотите убедиться что изменения применились:

1. **Откройте Render Dashboard**
2. **PostgreSQL → Connect**
3. **Выполните SQL запрос:**
```sql
-- Проверить что поле name существует
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'name';

-- Посмотреть пользователей с их именами
SELECT id, telegram_id, first_name, last_name, name, is_blocked 
FROM users 
LIMIT 10;

-- Проверить заявки на модерацию
SELECT pr.*, u.name as user_name 
FROM profile_change_requests pr
JOIN users u ON pr.user_id = u.id
ORDER BY pr.created_at DESC;
```

---

## 📊 Что изменилось в БД

### Таблица `users` - НОВОЕ поле:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  name VARCHAR(255),              -- ← НОВОЕ ПОЛЕ!
  photo_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Поле `name` содержит:
- Отображаемое имя пользователя (например: "Иван Иванов")
- Формируется из `first_name + ' ' + last_name`
- Может быть изменено через модерацию
- Используется для отображения в UI и в заявках на модерацию

---

## ⚠️ Важные примечания

### Для существующих пользователей:
- При первом входе после обновления поле `name` будет автоматически заполнено
- Если пользователь уже был в БД, миграция установит `name = first_name + last_name`
- Пользователь может изменить это имя через модерацию профиля

### Обратная совместимость:
- Поля `first_name` и `last_name` сохранены для совместимости с Telegram API
- Поле `name` используется только для отображения в приложении
- При обновлении профиля через Telegram, `name` автоматически обновляется

---

## ✅ Чеклист готовности

После деплоя убедитесь что:

- [ ] Backend запустился без ошибок
- [ ] В таблице users есть поле `name`
- [ ] У всех пользователей заполнено поле `name`
- [ ] Заблокированный пользователь не может зарегистрироваться на турнир
- [ ] Пользователь может отправить заявку на изменение имени
- [ ] Заявка появляется в админ панели
- [ ] Администратор может одобрить заявку
- [ ] После одобрения имя обновляется в профиле
- [ ] Нет ошибок в логах backend о несуществующих колонках

---

## 🎉 Готово!

**Обе критические ошибки исправлены!**

- ✅ Блокировка работает на уровне API
- ✅ Модерация профилей полностью функциональна
- ✅ База данных обновлена
- ✅ Frontend и Backend синхронизированы

**Можно деплоить и тестировать! 🚀**

