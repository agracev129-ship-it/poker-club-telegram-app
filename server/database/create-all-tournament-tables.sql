-- ============================================================================
-- СОЗДАНИЕ ВСЕХ НЕОБХОДИМЫХ ТАБЛИЦ ДЛЯ ТУРНИРОВ
-- ============================================================================
-- Этот скрипт создает все таблицы, необходимые для работы турниров
-- Выполните этот скрипт в вашей базе данных PostgreSQL на Render
-- ============================================================================

-- ============================================================================
-- 1. ТАБЛИЦА: TOURNAMENT_POINT_STRUCTURE
-- ============================================================================
-- Структура распределения очков для турнира

CREATE TABLE IF NOT EXISTS tournament_point_structure (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  place_from INTEGER NOT NULL,
  place_to INTEGER NOT NULL,
  points INTEGER NOT NULL,
  prize_percentage DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT tps_valid_range CHECK (place_from <= place_to),
  CONSTRAINT tps_positive_points CHECK (points >= 0)
);

CREATE INDEX IF NOT EXISTS idx_tps_game_id ON tournament_point_structure(game_id);
CREATE INDEX IF NOT EXISTS idx_tps_places ON tournament_point_structure(place_from, place_to);

-- ============================================================================
-- 2. ТАБЛИЦА: TOURNAMENT_PAYMENTS (КРИТИЧЕСКАЯ!)
-- ============================================================================
-- Детальная история оплат за турниры
-- ЭТА ТАБЛИЦА ОТСУТСТВУЕТ И ВЫЗЫВАЕТ ОШИБКУ!

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

-- ============================================================================
-- 3. ТАБЛИЦА: TOURNAMENT_ACTIONS_LOG
-- ============================================================================
-- Лог всех действий администратора в турнирах

CREATE TABLE IF NOT EXISTS tournament_actions_log (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  admin_id INTEGER NOT NULL REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL,
  target_user_id INTEGER REFERENCES users(id),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем constraint для action_type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tal_action_type_check'
  ) THEN
    ALTER TABLE tournament_actions_log ADD CONSTRAINT tal_action_type_check
    CHECK (action_type IN (
      'open_registration',
      'close_registration',
      'confirm_payment',
      'mark_no_show',
      'restore_player',
      'start_tournament',
      'assign_seat',
      'finalize_results',
      'cancel_tournament'
    ));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tal_game_id ON tournament_actions_log(game_id);
CREATE INDEX IF NOT EXISTS idx_tal_admin_id ON tournament_actions_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_tal_action_type ON tournament_actions_log(action_type);
CREATE INDEX IF NOT EXISTS idx_tal_created_at ON tournament_actions_log(created_at);

-- ============================================================================
-- ПРОВЕРКА СОЗДАНИЯ ТАБЛИЦ
-- ============================================================================

SELECT 'All tournament tables created successfully!' AS result;

-- Проверка существования таблиц
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('tournament_payments', 'tournament_actions_log', 'tournament_point_structure') 
    THEN '✅ Created'
    ELSE '❌ Missing'
  END AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tournament_payments', 'tournament_actions_log', 'tournament_point_structure')
ORDER BY table_name;

