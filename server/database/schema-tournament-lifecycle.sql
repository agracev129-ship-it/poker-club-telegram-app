-- ============================================================================
-- TOURNAMENT LIFECYCLE SYSTEM - ПОЛНАЯ МИГРАЦИЯ
-- ============================================================================

-- ============================================================================
-- 1. ОБНОВЛЕНИЕ ТАБЛИЦЫ GAMES
-- ============================================================================

-- Добавляем новые статусы турнира
ALTER TABLE games ADD COLUMN IF NOT EXISTS tournament_status VARCHAR(50) 
  DEFAULT 'upcoming';

-- Добавляем constraint для проверки статуса
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'games_tournament_status_check'
  ) THEN
    ALTER TABLE games ADD CONSTRAINT games_tournament_status_check 
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
  END IF;
END $$;

-- Добавляем поля для управления турниром
ALTER TABLE games ADD COLUMN IF NOT EXISTS check_in_opens_at TIMESTAMP;
ALTER TABLE games ADD COLUMN IF NOT EXISTS registration_closes_at TIMESTAMP;
ALTER TABLE games ADD COLUMN IF NOT EXISTS late_registration_ends_at TIMESTAMP;
ALTER TABLE games ADD COLUMN IF NOT EXISTS late_registration_levels INTEGER DEFAULT 3;
ALTER TABLE games ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
ALTER TABLE games ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP;
ALTER TABLE games ADD COLUMN IF NOT EXISTS total_prize_pool DECIMAL(10, 2);

-- Настройки автоматизации
ALTER TABLE games ADD COLUMN IF NOT EXISTS auto_close_registration BOOLEAN DEFAULT true;
ALTER TABLE games ADD COLUMN IF NOT EXISTS auto_exclude_no_show BOOLEAN DEFAULT true;
ALTER TABLE games ADD COLUMN IF NOT EXISTS allow_late_registration BOOLEAN DEFAULT true;

-- Индексы для games
CREATE INDEX IF NOT EXISTS idx_games_tournament_status ON games(tournament_status);
CREATE INDEX IF NOT EXISTS idx_games_check_in_time ON games(check_in_opens_at);

-- ============================================================================
-- 2. ОБНОВЛЕНИЕ ТАБЛИЦЫ GAME_REGISTRATIONS
-- ============================================================================

-- Удаляем старый constraint если есть
ALTER TABLE game_registrations DROP CONSTRAINT IF EXISTS game_registrations_status_check;

-- Добавляем новый constraint для статусов
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

-- Добавляем поля оплаты
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2);
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS payment_confirmed_by INTEGER REFERENCES users(id);

-- Добавляем constraint для payment_status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'gr_payment_status_check'
  ) THEN
    ALTER TABLE game_registrations ADD CONSTRAINT gr_payment_status_check
    CHECK (payment_status IN ('pending', 'paid', 'refunded'));
  END IF;
END $$;

-- Добавляем поля явки
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP;
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS checked_in_by INTEGER REFERENCES users(id);

-- Добавляем поля результатов
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS finish_position INTEGER;
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS finish_place_group VARCHAR(20);
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS prize_money DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS eliminated_at TIMESTAMP;
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS elimination_notes TEXT;

-- Добавляем поля рассадки
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS table_number INTEGER;
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS seat_number INTEGER;
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS initial_stack INTEGER;
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS is_late_entry BOOLEAN DEFAULT false;

-- Дополнительные поля
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS registration_type VARCHAR(20) DEFAULT 'online';
ALTER TABLE game_registrations ADD COLUMN IF NOT EXISTS notes TEXT;

-- Добавляем constraint для registration_type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'gr_registration_type_check'
  ) THEN
    ALTER TABLE game_registrations ADD CONSTRAINT gr_registration_type_check
    CHECK (registration_type IN ('online', 'onsite', 'late'));
  END IF;
END $$;

-- Индексы для game_registrations
CREATE INDEX IF NOT EXISTS idx_gr_payment_status ON game_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_gr_status ON game_registrations(status);
CREATE INDEX IF NOT EXISTS idx_gr_finish_position ON game_registrations(finish_position);
CREATE INDEX IF NOT EXISTS idx_gr_table ON game_registrations(game_id, table_number);

-- ============================================================================
-- 3. НОВАЯ ТАБЛИЦА: TOURNAMENT_POINT_STRUCTURE
-- ============================================================================

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
-- 4. НОВАЯ ТАБЛИЦА: TOURNAMENT_PAYMENTS
-- ============================================================================

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

-- ============================================================================
-- 5. НОВАЯ ТАБЛИЦА: TOURNAMENT_ACTIONS_LOG
-- ============================================================================

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
      'start_check_in',
      'check_in_player',
      'confirm_payment',
      'mark_no_show',
      'restore_player',
      'onsite_registration',
      'late_registration',
      'generate_seating',
      'start_tournament',
      'eliminate_player',
      'restore_eliminated',
      'rebalance_tables',
      'finish_tournament',
      'cancel_tournament',
      'add_bonus_points'
    ));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tal_game ON tournament_actions_log(game_id);
CREATE INDEX IF NOT EXISTS idx_tal_admin ON tournament_actions_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_tal_action ON tournament_actions_log(action_type);
CREATE INDEX IF NOT EXISTS idx_tal_created ON tournament_actions_log(created_at DESC);

-- ============================================================================
-- 6. МИГРАЦИЯ СУЩЕСТВУЮЩИХ ДАННЫХ
-- ============================================================================

-- Устанавливаем tournament_status для существующих турниров
UPDATE games 
SET tournament_status = CASE 
  WHEN status = 'completed' THEN 'completed'
  WHEN status = 'active' THEN 'in_progress'
  WHEN status = 'cancelled' THEN 'cancelled'
  ELSE 'upcoming'
END
WHERE tournament_status IS NULL;

-- Обновляем статусы регистраций для существующих данных
UPDATE game_registrations 
SET registration_type = 'online'
WHERE registration_type IS NULL;

-- Для существующих оплаченных регистраций
UPDATE game_registrations 
SET payment_status = 'paid',
    status = 'paid'
WHERE status = 'participated' OR status = 'registered';

-- ============================================================================
-- 7. ФУНКЦИИ ДЛЯ АВТОМАТИЗАЦИИ
-- ============================================================================

-- Функция для автоматического расчета prize_pool
CREATE OR REPLACE FUNCTION calculate_prize_pool(p_game_id INTEGER)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  v_total DECIMAL(10, 2);
BEGIN
  SELECT COALESCE(SUM(payment_amount), 0)
  INTO v_total
  FROM game_registrations
  WHERE game_id = p_game_id 
    AND payment_status = 'paid';
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Функция для получения статистики турнира
CREATE OR REPLACE FUNCTION get_tournament_stats(p_game_id INTEGER)
RETURNS TABLE (
  registered_count BIGINT,
  checked_in_count BIGINT,
  paid_count BIGINT,
  no_show_count BIGINT,
  late_registered_count BIGINT,
  playing_count BIGINT,
  eliminated_count BIGINT,
  total_prize_pool DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE status = 'registered') as registered_count,
    COUNT(*) FILTER (WHERE status = 'checked_in') as checked_in_count,
    COUNT(*) FILTER (WHERE status = 'paid' OR status = 'playing') as paid_count,
    COUNT(*) FILTER (WHERE status = 'no_show') as no_show_count,
    COUNT(*) FILTER (WHERE status = 'late_registered') as late_registered_count,
    COUNT(*) FILTER (WHERE status = 'playing') as playing_count,
    COUNT(*) FILTER (WHERE status = 'eliminated') as eliminated_count,
    COALESCE(SUM(payment_amount) FILTER (WHERE payment_status = 'paid'), 0) as total_prize_pool
  FROM game_registrations
  WHERE game_id = p_game_id;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления total_prize_pool
CREATE OR REPLACE FUNCTION update_game_prize_pool()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE games
  SET total_prize_pool = calculate_prize_pool(NEW.game_id)
  WHERE id = NEW.game_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_prize_pool ON game_registrations;
CREATE TRIGGER trigger_update_prize_pool
AFTER INSERT OR UPDATE OF payment_status, payment_amount ON game_registrations
FOR EACH ROW
WHEN (NEW.payment_status = 'paid')
EXECUTE FUNCTION update_game_prize_pool();

-- ============================================================================
-- 8. ВСТАВКА ТЕСТОВЫХ ДАННЫХ ДЛЯ СТРУКТУРЫ ОЧКОВ
-- ============================================================================

-- Функция для создания стандартной структуры очков
CREATE OR REPLACE FUNCTION create_default_point_structure(p_game_id INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Удаляем старую структуру если есть
  DELETE FROM tournament_point_structure WHERE game_id = p_game_id;
  
  -- Создаем стандартную структуру для турнира на 60 человек
  INSERT INTO tournament_point_structure (game_id, place_from, place_to, points, prize_percentage) VALUES
    (p_game_id, 1, 1, 100, 30.00),    -- 1 место: 100 очков, 30%
    (p_game_id, 2, 2, 80, 20.00),     -- 2 место: 80 очков, 20%
    (p_game_id, 3, 3, 65, 15.00),     -- 3 место: 65 очков, 15%
    (p_game_id, 4, 4, 55, 10.00),     -- 4 место: 55 очков, 10%
    (p_game_id, 5, 5, 50, 7.00),      -- 5 место: 50 очков, 7%
    (p_game_id, 6, 6, 45, 5.00),      -- 6 место: 45 очков, 5%
    (p_game_id, 7, 7, 40, 4.00),      -- 7 место: 40 очков, 4%
    (p_game_id, 8, 8, 35, 3.00),      -- 8 место: 35 очков, 3%
    (p_game_id, 9, 9, 30, 2.50),      -- 9 место: 30 очков, 2.5%
    (p_game_id, 10, 10, 25, 2.00),    -- 10 место: 25 очков, 2%
    (p_game_id, 11, 15, 20, 1.50),    -- 11-15 место: 20 очков, 1.5%
    (p_game_id, 16, 20, 15, 0),       -- 16-20 место: 15 очков
    (p_game_id, 21, 30, 10, 0),       -- 21-30 место: 10 очков
    (p_game_id, 31, 999, 5, 0);       -- 31+ место: 5 очков
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ЗАВЕРШЕНИЕ МИГРАЦИИ
-- ============================================================================

-- Обновляем существующие турниры со стандартной структурой очков
DO $$
DECLARE
  game_record RECORD;
BEGIN
  FOR game_record IN 
    SELECT id FROM games WHERE game_type = 'tournament'
  LOOP
    PERFORM create_default_point_structure(game_record.id);
  END LOOP;
END $$;

-- Выводим итоговую информацию
DO $$
DECLARE
  v_games_count INTEGER;
  v_registrations_count INTEGER;
  v_payments_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_games_count FROM games;
  SELECT COUNT(*) INTO v_registrations_count FROM game_registrations;
  SELECT COUNT(*) INTO v_payments_count FROM tournament_payments;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'МИГРАЦИЯ ЗАВЕРШЕНА УСПЕШНО!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Игр в базе: %', v_games_count;
  RAISE NOTICE 'Регистраций: %', v_registrations_count;
  RAISE NOTICE 'Платежей: %', v_payments_count;
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Новые таблицы:';
  RAISE NOTICE '  - tournament_point_structure';
  RAISE NOTICE '  - tournament_payments';
  RAISE NOTICE '  - tournament_actions_log';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Новые функции:';
  RAISE NOTICE '  - calculate_prize_pool()';
  RAISE NOTICE '  - get_tournament_stats()';
  RAISE NOTICE '  - create_default_point_structure()';
  RAISE NOTICE '============================================';
END $$;

