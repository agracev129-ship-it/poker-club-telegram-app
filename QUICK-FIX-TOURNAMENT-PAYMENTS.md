# ⚡ БЫСТРОЕ ИСПРАВЛЕНИЕ: Таблица tournament_payments не существует

## 🚨 Проблема
```
Database query error: error: relation "tournament_payments" does not exist
```

## ✅ Решение (5 минут)

### Шаг 1: Откройте Render Dashboard
1. Перейдите на https://dashboard.render.com
2. Найдите ваш PostgreSQL сервис
3. Нажмите на него

### Шаг 2: Получите данные подключения
1. Нажмите "Connect" в правом верхнем углу
2. Скопируйте "External Database URL" или "Internal Database URL"

### Шаг 3: Выполните SQL скрипт

**Вариант A: Через онлайн SQL редактор (самый простой)**
1. Откройте https://www.elephantsql.com/ или любой другой PostgreSQL клиент
2. Подключитесь к базе данных Render
3. Откройте файл `server/database/create-tournament-payments.sql`
4. Скопируйте весь SQL код
5. Вставьте в SQL редактор и выполните

**Вариант B: Через psql (командная строка)**
```bash
psql "postgresql://user:password@host:port/database" -f server/database/create-tournament-payments.sql
```

### Шаг 4: Проверьте
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'tournament_payments';
```

Должна вернуться строка с `tournament_payments`.

### Шаг 5: Перезапустите сервер
- В Render Dashboard найдите ваш сервер
- Нажмите "Manual Deploy" → "Deploy latest commit"

---

## 📋 SQL скрипт (скопируйте и выполните)

```sql
CREATE TABLE IF NOT EXISTS tournament_payments (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registration_id INTEGER REFERENCES game_registrations(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  confirmed_by INTEGER REFERENCES users(id),
  confirmed_at TIMESTAMP,
  refunded_at TIMESTAMP,
  refund_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT tp_status_check CHECK (status IN ('pending', 'confirmed', 'refunded')),
  CONSTRAINT tp_amount_positive CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_tp_game_user ON tournament_payments(game_id, user_id);
CREATE INDEX IF NOT EXISTS idx_tp_status ON tournament_payments(status);
CREATE INDEX IF NOT EXISTS idx_tp_registration ON tournament_payments(registration_id);
CREATE INDEX IF NOT EXISTS idx_tp_created_at ON tournament_payments(created_at);
```

---

## 🎯 После исправления

✅ Ошибка исчезнет  
✅ Подтверждение оплаты будет работать  
✅ Игроки будут правильно отображаться в списке "Оплатили"

---

**Подробная инструкция:** `FIX-TOURNAMENT-PAYMENTS-TABLE.md`

