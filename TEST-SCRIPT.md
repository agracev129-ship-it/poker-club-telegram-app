# 🧪 БЫСТРЫЙ ТЕСТ УПРОЩЕННОЙ СИСТЕМЫ

## Запуск

1. Запустите сервер:
```bash
cd c:\Users\grach\source\repos\NBKapp\poker-club-telegram-app
npm start
```

2. Проверьте вывод - должно быть:
```
✅ Simplified Tournament System initialized successfully!
✅ Tournament automation jobs initialized
🚀 Server running on port 3001
```

---

## Тест 1: Проверка БД

Подключитесь к PostgreSQL:

```sql
-- Проверка упрощенных статусов
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'games_tournament_status_check';

-- Должно показать: upcoming, started, in_progress, completed, cancelled

-- Проверка регистраций
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'game_registrations_status_check';

-- Должно показать: registered, paid, playing, eliminated, no_show, cancelled
```

---

## Тест 2: Создание турнира через API

```bash
curl -X POST http://localhost:3001/api/games \
  -H "Content-Type: application/json" \
  -H "x-telegram-init-data: [ваш init data]" \
  -d '{
    "name": "TEST SIMPLIFIED TOURNAMENT",
    "date": "2025-11-03",
    "time": "19:00",
    "game_type": "tournament",
    "max_players": 20,
    "buy_in": 1000
  }'
```

Ожидаемый результат: Турнир создан, статус = **upcoming**

---

## Тест 3: Регистрация игрока

```bash
curl -X POST http://localhost:3001/api/games/[ID]/register \
  -H "x-telegram-init-data: [ваш init data]"
```

Проверка в БД:
```sql
SELECT status, payment_status FROM game_registrations WHERE game_id = [ID];
```

Ожидаемый результат: status = **registered**, payment_status = **pending**

---

## Тест 4: Подтверждение оплаты (АДМИН)

```bash
curl -X POST http://localhost:3001/api/games/[ID]/confirm-payment \
  -H "Content-Type: application/json" \
  -H "x-telegram-init-data: [admin init data]" \
  -d '{
    "userId": [USER_ID],
    "amount": 1000,
    "paymentMethod": "cash"
  }'
```

Проверка:
```sql
SELECT status, payment_status, payment_amount 
FROM game_registrations 
WHERE game_id = [ID] AND user_id = [USER_ID];
```

Ожидаемый результат: status = **paid**, payment_status = **paid**

---

## Тест 5: Начало турнира (АДМИН)

```bash
curl -X POST http://localhost:3001/api/games/[ID]/start \
  -H "x-telegram-init-data: [admin init data]"
```

Проверка рассадки:
```sql
-- Должны быть только оплатившие
SELECT COUNT(*) FROM table_assignments WHERE game_id = [ID];

-- Проверка соответствия
SELECT 
  gr.user_id,
  gr.status,
  gr.table_number as gr_table,
  gr.seat_number as gr_seat,
  ta.table_number as ta_table,
  ta.seat_number as ta_seat
FROM game_registrations gr
LEFT JOIN table_assignments ta ON gr.game_id = ta.game_id AND gr.user_id = ta.user_id
WHERE gr.game_id = [ID] AND gr.status = 'playing';
```

Ожидаемый результат:
- Статус турнира = **started**
- Только оплатившие в рассадке
- gr_table = ta_table, gr_seat = ta_seat (совпадают!)

---

## Тест 6: SeatingView пользователя

В приложении:
1. Войдите как оплативший игрок
2. Откройте "Посадка"
3. Должны увидеть: Стол X, Место Y

Войдите как неоплативший игрок:
1. Откройте "Посадка"
2. Должно быть: "Посадка недоступна"

---

## Тест 7: Поздняя регистрация (АДМИН)

В приложении (админ-панель):
1. Управление турниром → "Поздняя регистрация"
2. Найти игрока по имени
3. Указать сумму оплаты
4. Подтвердить

Проверка:
```sql
SELECT 
  user_id, 
  status, 
  is_late_entry, 
  table_number, 
  seat_number 
FROM game_registrations 
WHERE game_id = [ID] AND is_late_entry = true;
```

Ожидаемый результат:
- status = **paid**
- is_late_entry = **true**
- table_number и seat_number назначены автоматически

---

## ✅ КРИТЕРИИ УСПЕХА

Тест пройден если:
- [x] Сервер запустился без ошибок
- [x] Миграции применились
- [x] API endpoints работают
- [x] Рассадка генерируется только для оплативших
- [x] Рассадка синхронизирована (game_registrations ↔️ table_assignments)
- [x] SeatingView показывает место только оплатившим
- [x] Поздняя регистрация автоматически назначает место
- [x] Админ-панель работает корректно

---

## 🚨 ВОЗМОЖНЫЕ ОШИБКИ

### Ошибка: "column does not exist"
**Причина:** Миграция не применилась  
**Решение:** Перезапустить сервер или выполнить SQL вручную

### Ошибка: "Registration not found"
**Причина:** Пользователь не зарегистрирован  
**Решение:** Сначала зарегистрироваться на турнир

### Ошибка: "No paid players"
**Причина:** Никто не оплатил  
**Решение:** Подтвердить минимум 1 оплату перед стартом

---

Удачного тестирования! 🎯

