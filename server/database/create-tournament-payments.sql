-- ============================================================================
-- СОЗДАНИЕ ТАБЛИЦЫ TOURNAMENT_PAYMENTS
-- ============================================================================
-- Этот скрипт создает таблицу для хранения информации о платежах за турниры
-- Выполните этот скрипт в вашей базе данных PostgreSQL на Render
-- ============================================================================

-- Создание таблицы tournament_payments
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

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_tp_game_user ON tournament_payments(game_id, user_id);
CREATE INDEX IF NOT EXISTS idx_tp_status ON tournament_payments(status);
CREATE INDEX IF NOT EXISTS idx_tp_registration ON tournament_payments(registration_id);
CREATE INDEX IF NOT EXISTS idx_tp_created_at ON tournament_payments(created_at);

-- Проверка, что таблица создана
SELECT 'Table tournament_payments created successfully!' AS result;

