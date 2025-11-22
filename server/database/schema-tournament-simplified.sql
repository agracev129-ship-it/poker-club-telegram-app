-- ============================================================================
-- УПРОЩЕННАЯ СИСТЕМА УПРАВЛЕНИЯ ТУРНИРОМ
-- ============================================================================

-- Обновляем constraint для статусов турнира (упрощенные)
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_tournament_status_check;
ALTER TABLE games ADD CONSTRAINT games_tournament_status_check 
  CHECK (tournament_status IN (
    'upcoming',        -- Создан, можно регистрироваться
    'started',         -- Турнир начался
    'in_progress',     -- Игра идет
    'completed',       -- Завершен
    'cancelled'        -- Отменен
  ));

-- Обновляем статусы существующих турниров
UPDATE games 
SET tournament_status = CASE 
  WHEN tournament_status IN ('registration_open', 'check_in', 'finalizing', 'seating') THEN 'upcoming'
  WHEN tournament_status IN ('late_registration') THEN 'started'
  ELSE tournament_status
END;

-- Упрощаем статусы регистрации - только Ожидают и Оплатили
ALTER TABLE game_registrations DROP CONSTRAINT IF EXISTS game_registrations_status_check;
ALTER TABLE game_registrations ADD CONSTRAINT game_registrations_status_check 
  CHECK (status IN (
    'registered',      -- Ожидают оплаты
    'paid',           -- Оплатили, могут играть
    'playing',        -- Играют в турнире
    'eliminated',     -- Выбыли
    'no_show',        -- Не явились/исключены
    'cancelled',      -- Отменили регистрацию
    'participated'    -- Участвовали в завершенном турнире
  ));

-- Обновляем статусы существующих регистраций
UPDATE game_registrations 
SET status = CASE 
  WHEN status = 'checked_in' THEN 'registered'
  WHEN status = 'late_registered' THEN 'paid'
  ELSE status
END;

-- Удаляем ненужные поля check-in (но оставляем payment поля)
-- checked_in_at, checked_in_by можно оставить для истории, но не использовать

-- ============================================================================
-- ОБНОВЛЕННАЯ ФУНКЦИЯ СТАТИСТИКИ
-- ============================================================================

DROP FUNCTION IF EXISTS get_tournament_stats(INTEGER);

CREATE OR REPLACE FUNCTION get_tournament_stats(p_game_id INTEGER)
RETURNS TABLE (
  registered_count BIGINT,
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
    COUNT(*) FILTER (WHERE status = 'paid' OR status = 'playing') as paid_count,
    COUNT(*) FILTER (WHERE status = 'no_show') as no_show_count,
    COUNT(*) FILTER (WHERE is_late_entry = true) as late_registered_count,
    COUNT(*) FILTER (WHERE status = 'playing') as playing_count,
    COUNT(*) FILTER (WHERE status = 'eliminated') as eliminated_count,
    COALESCE(SUM(payment_amount) FILTER (WHERE payment_status = 'paid'), 0) as total_prize_pool
  FROM game_registrations
  WHERE game_id = p_game_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- КОММЕНТАРИИ К УПРОЩЕННОЙ СХЕМЕ
-- ============================================================================

COMMENT ON CONSTRAINT games_tournament_status_check ON games IS 
'Упрощенные статусы: upcoming (можно регистрироваться) -> started (идет игра) -> completed';

COMMENT ON CONSTRAINT game_registrations_status_check ON game_registrations IS 
'Упрощенные статусы: registered (ожидают) -> paid (оплатили) -> playing/eliminated';

-- Вывод
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'УПРОЩЕННАЯ СХЕМА ПРИМЕНЕНА!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Статусы турнира: upcoming, started, in_progress, completed, cancelled';
  RAISE NOTICE 'Статусы регистрации: registered, paid, playing, eliminated, no_show, cancelled';
  RAISE NOTICE '============================================';
END $$;


