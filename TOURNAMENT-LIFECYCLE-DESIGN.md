# 🎰 ПОЛНЫЙ ЖИЗНЕННЫЙ ЦИКЛ ТУРНИРА

## 📋 АНАЛИЗ ТЕКУЩЕЙ СИСТЕМЫ

### ❌ КРИТИЧЕСКИЕ НЕДОЧЕТЫ:

1. **Нет системы оплаты**
   - Есть поле `buy_in`, но нет отслеживания оплаты
   - Нет статуса оплаты у регистраций
   - Нет механизма подтверждения оплаты администратором

2. **Нет управления явкой игроков**
   - Нельзя отметить, что игрок пришел
   - Нельзя исключить неявившихся
   - Нет различия между "зарегистрирован" и "явился"

3. **Нет поздней регистрации**
   - После старта турнира регистрация невозможна
   - Нельзя добавить игрока, пришедшего без записи

4. **Неполная система статусов**
   - Нет четких этапов жизненного цикла
   - Статусы не отражают реальное состояние турнира

5. **Примитивная система результатов**
   - Нет детальной истории игры
   - Нет связи выбывания с начислением очков

---

## 🎯 ПРЕДЛАГАЕМЫЙ ЖИЗНЕННЫЙ ЦИКЛ

```
┌────────────────────────────────────────────────────────────────┐
│                    ПОЛНЫЙ ЖИЗНЕННЫЙ ЦИКЛ                       │
└────────────────────────────────────────────────────────────────┘

1. СОЗДАНИЕ ТУРНИРА (upcoming)
   ├── Админ создает турнир
   ├── Устанавливает параметры (дата, время, buy-in, места)
   └── Настраивает распределение очков по местам

2. РЕГИСТРАЦИЯ (registration_open)
   ├── Игроки регистрируются онлайн
   ├── Статус: registered (не оплачено)
   └── Доступна отмена регистрации

3. ПРИЕМ ИГРОКОВ (check_in)
   ├── За 30-60 минут до старта
   ├── Админ отмечает явку: registered → checked_in
   ├── Админ подтверждает оплату: checked_in → paid
   ├── Возможна поздняя регистрация на месте
   └── Админ исключает неявившихся: registered → no_show

4. ФИНАЛИЗАЦИЯ СОСТАВА (finalizing)
   ├── За 5-10 минут до старта
   ├── Закрытие регистрации
   ├── Проверка всех оплат
   └── Формирование финального списка участников

5. ГЕНЕРАЦИЯ РАССАДКИ (seating)
   ├── Автоматическое распределение по столам
   ├── Случайная рассадка
   └── Публикация для игроков

6. СТАРТ ТУРНИРА (started)
   ├── Официальное начало
   ├── Блокировка изменений состава
   └── Начало отсчета времени

7. ПОЗДНЯЯ РЕГИСТРАЦИЯ (late_registration)
   ├── Возможна в течение N уровней
   ├── Игрок сразу оплачивает и садится
   ├── Автоматическое добавление в рассадку
   └── Статус: late_registered → playing

8. ПРОЦЕСС ИГРЫ (in_progress)
   ├── Отслеживание выбывших игроков
   ├── Ребалансировка столов
   ├── Фиксация мест выбытия
   └── Автоматический расчет очков

9. ЗАВЕРШЕНИЕ (finishing)
   ├── Определение победителя
   ├── Фиксация финальных мест
   └── Расчет призовых и очков

10. ПОДВЕДЕНИЕ ИТОГОВ (completed)
    ├── Начисление очков в рейтинг
    ├── Обновление статистики игроков
    ├── Сохранение в историю
    └── Публикация результатов

11. АРХИВАЦИЯ (archived)
    └── Перенос в историю через 30 дней
```

---

## 💾 НОВАЯ СТРУКТУРА БАЗЫ ДАННЫХ

### 1. Обновление таблицы GAMES

```sql
ALTER TABLE games ADD COLUMN IF NOT EXISTS tournament_status VARCHAR(50) 
  DEFAULT 'upcoming' 
  CHECK (tournament_status IN (
    'upcoming',           -- Создан, регистрация не открыта
    'registration_open',  -- Регистрация открыта
    'check_in',          -- Прием игроков
    'finalizing',        -- Финализация состава
    'seating',           -- Генерация рассадки
    'started',           -- Турнир начался
    'late_registration', -- Поздняя регистрация активна
    'in_progress',       -- Игра идет
    'finishing',         -- Завершение
    'completed',         -- Завершен
    'cancelled',         -- Отменен
    'archived'           -- Заархивирован
  ));

-- Добавляем поля для управления турниром
ALTER TABLE games ADD COLUMN IF NOT EXISTS check_in_opens_at TIMESTAMP; -- Когда открывается прием
ALTER TABLE games ADD COLUMN IF NOT EXISTS registration_closes_at TIMESTAMP; -- Когда закрывается регистрация
ALTER TABLE games ADD COLUMN IF NOT EXISTS late_registration_ends_at TIMESTAMP; -- Конец поздней регистрации
ALTER TABLE games ADD COLUMN IF NOT EXISTS late_registration_levels INTEGER DEFAULT 3; -- Сколько уровней доступна поздняя регистрация
ALTER TABLE games ADD COLUMN IF NOT EXISTS started_at TIMESTAMP; -- Когда реально начался
ALTER TABLE games ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP; -- Когда завершился
ALTER TABLE games ADD COLUMN IF NOT EXISTS total_prize_pool DECIMAL(10, 2); -- Общий призовой фонд

-- Настройки автоматизации
ALTER TABLE games ADD COLUMN IF NOT EXISTS auto_close_registration BOOLEAN DEFAULT true;
ALTER TABLE games ADD COLUMN IF NOT EXISTS auto_exclude_no_show BOOLEAN DEFAULT true;
ALTER TABLE games ADD COLUMN IF NOT EXISTS allow_late_registration BOOLEAN DEFAULT true;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_games_tournament_status ON games(tournament_status);
CREATE INDEX IF NOT EXISTS idx_games_check_in_time ON games(check_in_opens_at);
```

### 2. Расширение таблицы GAME_REGISTRATIONS

```sql
-- Добавляем статусы регистрации
ALTER TABLE game_registrations DROP CONSTRAINT IF EXISTS game_registrations_status_check;
ALTER TABLE game_registrations ADD CONSTRAINT game_registrations_status_check 
  CHECK (status IN (
    'registered',      -- Зарегистрирован онлайн
    'checked_in',      -- Явился, но не оплатил
    'paid',           -- Оплатил (играет)
    'late_registered', -- Поздняя регистрация
    'playing',        -- Играет
    'eliminated',     -- Выбыл
    'no_show',        -- Не явился
    'cancelled'       -- Отменил регистрацию
  ));

-- Добавляем поля оплаты и явки
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' 
  CHECK (payment_status IN ('pending', 'paid', 'refunded'));
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2);
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50); -- cash, card, transfer
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS payment_confirmed_by INTEGER REFERENCES users(id); -- Кто подтвердил оплату

-- Явка
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP;
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS checked_in_by INTEGER REFERENCES users(id); -- Кто отметил явку

-- Результаты
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS finish_position INTEGER; -- Итоговое место
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS finish_place_group VARCHAR(20); -- top3, top10, itm, etc
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS prize_money DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS eliminated_at TIMESTAMP;
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS elimination_notes TEXT; -- Заметки о выбывании

-- Рассадка
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS table_number INTEGER;
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS seat_number INTEGER;
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS initial_stack INTEGER; -- Начальный стек
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS is_late_entry BOOLEAN DEFAULT false;

-- Дополнительно
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS registration_type VARCHAR(20) DEFAULT 'online' 
  CHECK (registration_type IN ('online', 'onsite', 'late'));
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS notes TEXT; -- Заметки администратора

-- Индексы
CREATE INDEX IF NOT EXISTS idx_gr_payment_status ON game_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_gr_status ON game_registrations(status);
CREATE INDEX IF NOT EXISTS idx_gr_finish_position ON game_registrations(finish_position);
CREATE INDEX IF NOT EXISTS idx_gr_table ON game_registrations(game_id, table_number);
```

### 3. Новая таблица TOURNAMENT_POINT_STRUCTURE

```sql
-- Структура распределения очков для турнира
CREATE TABLE IF NOT EXISTS tournament_point_structure (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  place_from INTEGER NOT NULL, -- С какого места
  place_to INTEGER NOT NULL,   -- По какое место
  points INTEGER NOT NULL,      -- Сколько очков
  prize_percentage DECIMAL(5, 2), -- % от призового фонда (опционально)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tps_game_id ON tournament_point_structure(game_id);
```

### 4. Новая таблица TOURNAMENT_PAYMENTS

```sql
-- Детальная история оплат
CREATE TABLE IF NOT EXISTS tournament_payments (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registration_id INTEGER REFERENCES game_registrations(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- cash, card, transfer, online
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'refunded')),
  confirmed_by INTEGER REFERENCES users(id), -- Админ, подтвердивший оплату
  confirmed_at TIMESTAMP,
  refunded_at TIMESTAMP,
  refund_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tp_game_user ON tournament_payments(game_id, user_id);
CREATE INDEX IF NOT EXISTS idx_tp_status ON tournament_payments(status);
```

### 5. Новая таблица TOURNAMENT_ACTIONS_LOG

```sql
-- Лог всех действий администратора
CREATE TABLE IF NOT EXISTS tournament_actions_log (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  admin_id INTEGER NOT NULL REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL, -- check_in, confirm_payment, eliminate, exclude, late_register, etc
  target_user_id INTEGER REFERENCES users(id),
  details JSONB, -- Дополнительные данные
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tal_game ON tournament_actions_log(game_id);
CREATE INDEX IF NOT EXISTS idx_tal_admin ON tournament_actions_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_tal_action ON tournament_actions_log(action_type);
```

---

## 🔧 НОВЫЕ API ENDPOINTS

### Управление турниром

```javascript
// 1. Открыть регистрацию
POST /api/games/:id/open-registration
Auth: Admin
Response: { status: 'registration_open', message: 'Регистрация открыта' }

// 2. Закрыть регистрацию
POST /api/games/:id/close-registration
Auth: Admin
Response: { status: 'finalizing', message: 'Регистрация закрыта' }

// 3. Начать прием игроков (check-in)
POST /api/games/:id/start-check-in
Auth: Admin
Response: { status: 'check_in', message: 'Прием игроков начат' }
```

### Прием игроков

```javascript
// 4. Отметить явку игрока
POST /api/games/:id/check-in
Auth: Admin
Body: { userId: 123 }
Response: { user, status: 'checked_in', message: 'Игрок отмечен как явившийся' }

// 5. Подтвердить оплату
POST /api/games/:id/confirm-payment
Auth: Admin
Body: {
  userId: 123,
  amount: 5000,
  paymentMethod: 'cash', // cash, card, transfer
  notes: 'Оплатил наличными'
}
Response: { user, status: 'paid', payment: {...} }

// 6. Исключить неявившегося
POST /api/games/:id/mark-no-show
Auth: Admin
Body: { userId: 123, reason: 'Не явился без предупреждения' }
Response: { user, status: 'no_show', message: 'Игрок исключен' }

// 7. Восстановить исключенного
POST /api/games/:id/restore-player
Auth: Admin
Body: { userId: 123 }
Response: { user, status: 'registered', message: 'Игрок восстановлен' }
```

### Поздняя регистрация

```javascript
// 8. Зарегистрировать игрока на месте (до старта)
POST /api/games/:id/onsite-registration
Auth: Admin
Body: {
  userId: 123,
  paymentMethod: 'cash',
  amount: 5000,
  notes: 'Пришел без записи'
}
Response: { registration, status: 'paid', message: 'Игрок зарегистрирован на месте' }

// 9. Поздняя регистрация (после старта)
POST /api/games/:id/late-registration
Auth: Admin
Body: {
  userId: 123,
  paymentMethod: 'cash',
  amount: 5000,
  tableNumber: 3,
  seatNumber: 5
}
Response: { 
  registration, 
  status: 'late_registered',
  seating: { table: 3, seat: 5 },
  message: 'Игрок добавлен в игру' 
}

// 10. Проверить доступность поздней регистрации
GET /api/games/:id/late-registration/status
Response: { 
  available: true, 
  endsAt: '2024-01-15T20:00:00Z',
  levelsRemaining: 2
}
```

### Управление составом

```javascript
// 11. Получить список по статусам
GET /api/games/:id/players?status=checked_in
Response: [{ user, registration, payment }]

// 12. Получить статистику по турниру
GET /api/games/:id/stats
Response: {
  registered: 45,
  checkedIn: 38,
  paid: 35,
  noShow: 7,
  lateRegistered: 3,
  playing: 38,
  eliminated: 15,
  remaining: 23,
  totalPrizePool: 190000
}
```

### Завершение турнира

```javascript
// 13. Завершить турнир и начислить очки
POST /api/games/:id/finalize-results
Auth: Admin
Body: {
  autoCalculatePoints: true, // Автоматически по структуре
  manualAdjustments: [ // Опционально
    { userId: 123, bonusPoints: 10, reason: 'Самый молодой игрок' }
  ]
}
Response: {
  results: [...],
  pointsAwarded: {...},
  prizeMoneyAwarded: {...},
  message: 'Результаты сохранены и очки начислены'
}
```

---

## 📱 UI/UX КОМПОНЕНТЫ

### 1. AdminCheckInView (Новый компонент)

**Экран приема игроков для администратора**

```typescript
Features:
- Список всех зарегистрированных игроков
- Поиск по имени
- Фильтры: Все / Ожидают / Пришли / Оплатили / Не явились
- Быстрые действия для каждого игрока:
  ✓ Отметить явку
  💰 Подтвердить оплату (с выбором метода)
  ❌ Отметить как не явившегося
  ↻ Восстановить
- Кнопка "Добавить игрока на месте"
- Счетчик: 35 из 45 оплатили
- Таймер до старта турнира
```

### 2. AdminLateRegistrationView (Новый компонент)

**Экран поздней регистрации**

```typescript
Features:
- Поиск игрока в базе
- Добавление нового игрока
- Выбор свободного места за столом (интерактивная схема)
- Подтверждение оплаты
- Автоматическое добавление в рассадку
- Уведомление о добавлении игрока
```

### 3. AdminTournamentDashboard (Обновление)

**Обновленная панель управления турниром**

```typescript
Sections:
┌─────────────────────────────────────────┐
│ СТАТУС: В процессе приема игроков       │
│ ⏰ До старта: 25 минут                  │
├─────────────────────────────────────────┤
│ 📊 Статистика:                          │
│  • Зарегистрировано: 45                 │
│  • Явилось: 38                          │
│  • Оплатило: 35                         │
│  • Не явилось: 7                        │
│  • Призовой фонд: 175,000₽              │
├─────────────────────────────────────────┤
│ 🎬 Действия:                            │
│  [Начать прием игроков]                 │
│  [Открыть список для проверки]          │
│  [Добавить игрока на месте]             │
│  [Исключить неявившихся]                │
│  [Сгенерировать рассадку]               │
│  [Начать турнир]                        │
└─────────────────────────────────────────┘
```

### 4. PlayerCheckInStatus (Новый компонент)

**Карточка статуса для игрока**

```typescript
Features:
- Отображение текущего статуса регистрации
- Уведомления о необходимости явки
- Информация об оплате
- QR-код для быстрой проверки (опционально)
- Напоминание о времени check-in
```

---

## 🤖 АВТОМАТИЗАЦИЯ

### 1. Автоматическое открытие регистрации

```javascript
// Cron job: каждую минуту проверяем турниры
async function autoOpenRegistration() {
  const games = await Game.getAll({
    tournament_status: 'upcoming',
    auto_close_registration: true
  });
  
  for (const game of games) {
    const registrationOpenTime = game.date - 7 days; // За неделю до турнира
    if (now >= registrationOpenTime) {
      await Game.update(game.id, { tournament_status: 'registration_open' });
      // Отправить уведомления игрокам
    }
  }
}
```

### 2. Автоматическое начало check-in

```javascript
async function autoStartCheckIn() {
  const games = await Game.getAll({
    tournament_status: 'registration_open'
  });
  
  for (const game of games) {
    const checkInTime = game.date - 1 hour; // За час до турнира
    if (now >= checkInTime) {
      await Game.update(game.id, { 
        tournament_status: 'check_in',
        check_in_opens_at: now
      });
      // Уведомить админов
    }
  }
}
```

### 3. Автоматическое исключение неявившихся

```javascript
async function autoExcludeNoShow() {
  const games = await Game.getAll({
    tournament_status: 'check_in',
    auto_exclude_no_show: true
  });
  
  for (const game of games) {
    const excludeTime = game.date - 10 minutes; // За 10 минут до старта
    if (now >= excludeTime) {
      // Исключаем всех, кто не отмечен как checked_in или paid
      const registrations = await Game.getRegistrations(game.id, 'registered');
      for (const reg of registrations) {
        await Game.updateRegistration(reg.id, { status: 'no_show' });
        // Логируем действие
      }
    }
  }
}
```

### 4. Автоматическое закрытие поздней регистрации

```javascript
async function autoCloseLateRegistration() {
  const games = await Game.getAll({
    tournament_status: 'late_registration'
  });
  
  for (const game of games) {
    if (now >= game.late_registration_ends_at) {
      await Game.update(game.id, { tournament_status: 'in_progress' });
      // Уведомить админов
    }
  }
}
```

---

## 📊 ЛОГИКА НАЧИСЛЕНИЯ ОЧКОВ

### 1. Автоматический расчет по структуре

```javascript
async function calculatePoints(gameId) {
  const structure = await TournamentPointStructure.getByGameId(gameId);
  const results = await Game.getRegistrations(gameId, 'eliminated');
  
  const pointsMap = new Map();
  
  for (const player of results) {
    const position = player.finish_position;
    const pointsEntry = structure.find(s => 
      position >= s.place_from && position <= s.place_to
    );
    
    if (pointsEntry) {
      pointsMap.set(player.user_id, pointsEntry.points);
    }
  }
  
  return pointsMap;
}
```

### 2. Применение очков к рейтингу

```javascript
async function applyPointsToRating(gameId, pointsMap) {
  for (const [userId, points] of pointsMap.entries()) {
    // Обновляем game_registrations
    await Game.updateRegistration(gameId, userId, { points_earned: points });
    
    // Обновляем user_stats
    await UserStats.incrementPoints(userId, points);
    
    // Логируем в user_activities
    await UserActivity.create({
      user_id: userId,
      activity_type: 'points_earned',
      description: `Получено ${points} очков за ${gameId}`,
      related_id: gameId
    });
  }
  
  // Пересчитываем рейтинг всех игроков
  await User.updateRankings();
}
```

---

## 🎮 ПОЛНЫЙ СЦЕНАРИЙ ИСПОЛЬЗОВАНИЯ

### Сценарий 1: Идеальный турнир

```
1. Админ создает турнир на 50 мест, buy-in 5000₽
2. За неделю автоматически открывается регистрация
3. Игроки регистрируются онлайн (45 человек)
4. За час до турнира автоматически начинается check-in
5. Игроки приходят, админ:
   - Отмечает явку (checked_in)
   - Подтверждает оплату (paid)
6. Явилось 38 из 45, 7 не пришли
7. За 10 минут до старта админ исключает неявившихся
8. Админ генерирует рассадку на 38 игроков
9. Турнир начинается
10. Два игрока опоздали, админ добавляет их через позднюю регистрацию
11. Игроки выбывают, админ отмечает выбытие и место
12. Определяется победитель
13. Админ завершает турнир
14. Система автоматически начисляет очки по структуре
15. Обновляется рейтинг
16. Результаты публикуются в истории
```

### Сценарий 2: Турнир с проблемами

```
1. Игрок зарегистрировался, но не пришел → Админ исключает → Статус no_show
2. Игрок пришел без регистрации → Админ регистрирует на месте → Статус paid
3. Игрок пришел, но не может оплатить → Админ отмечает checked_in → Ждет оплаты
4. Игрок опоздал на 30 минут → Админ добавляет через позднюю регистрацию
5. Ошибочно выбил игрока → Админ восстанавливает игрока
6. Технический сбой → Админ отменяет старт → Возвращается к check_in
```

---

## 📈 ПРЕИМУЩЕСТВА НОВОЙ СИСТЕМЫ

✅ **Полный контроль над турниром** - каждый этап отслеживается  
✅ **Прозрачная оплата** - детальная история всех платежей  
✅ **Гибкость** - поздняя регистрация, восстановление игроков  
✅ **Автоматизация** - минимум ручной работы  
✅ **Аналитика** - полная статистика по турнирам  
✅ **Честность** - невозможно манипулировать результатами  
✅ **История** - полный аудит всех действий администратора  

---

## 🚀 ПЛАН ВНЕДРЕНИЯ

### Этап 1: Миграция базы данных (1 день)
- Создать SQL-скрипты миграции
- Добавить новые поля и таблицы
- Мигрировать существующие данные

### Этап 2: Backend API (2-3 дня)
- Реализовать новые endpoints
- Добавить логику управления турниром
- Создать автоматические задачи (cron jobs)

### Этап 3: Frontend Admin UI (3-4 дня)
- Создать AdminCheckInView
- Создать AdminLateRegistrationView
- Обновить AdminTournamentDashboard
- Добавить управление оплатами

### Этап 4: Frontend Player UI (2 дня)
- Обновить отображение статусов
- Добавить уведомления о check-in
- Обновить историю турниров

### Этап 5: Тестирование (2 дня)
- Тестирование полного цикла
- Исправление багов
- Оптимизация производительности

**Итого: ~10-12 дней разработки**

---

## 💡 ДОПОЛНИТЕЛЬНЫЕ ИДЕИ

1. **QR-коды для быстрой проверки** - игрок показывает QR, админ сканирует
2. **Push-уведомления** - напоминания об явке, оплате
3. **Интеграция с платежными системами** - онлайн-оплата buy-in
4. **Видео-стриминг финального стола** - интеграция трансляции
5. **Система штрафов** - за неявку без предупреждения
6. **Программа лояльности** - скидки на buy-in для постоянных игроков
7. **Бронирование мест** - возможность забронировать место за столом
8. **Мобильное приложение для администраторов** - упрощенное управление

---

Хотите, чтобы я начал реализовывать эту систему? С чего начнем?

