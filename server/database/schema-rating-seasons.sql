-- ============================================================================
-- RATING SEASONS SCHEMA
-- ============================================================================
-- Система сезонов рейтинга для разделения турниров по временным периодам
-- 
-- Создано: 2025-11-24
-- ============================================================================

-- Создание таблицы сезонов рейтинга
CREATE TABLE IF NOT EXISTS rating_seasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Проверки
  CONSTRAINT seasons_dates_check CHECK (end_date >= start_date),
  CONSTRAINT seasons_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_rating_seasons_is_active ON rating_seasons(is_active);
CREATE INDEX IF NOT EXISTS idx_rating_seasons_dates ON rating_seasons(start_date, end_date);

-- Добавление поля season_id в таблицу games
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS season_id INTEGER,
ADD CONSTRAINT fk_games_season 
  FOREIGN KEY (season_id) 
  REFERENCES rating_seasons(id) 
  ON DELETE SET NULL;

-- Индекс для быстрого поиска игр по сезону
CREATE INDEX IF NOT EXISTS idx_games_season_id ON games(season_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_rating_seasons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS trigger_update_rating_seasons_updated_at ON rating_seasons;
CREATE TRIGGER trigger_update_rating_seasons_updated_at
  BEFORE UPDATE ON rating_seasons
  FOR EACH ROW
  EXECUTE FUNCTION update_rating_seasons_updated_at();

-- Создание первого сезона по умолчанию (если таблица пустая)
INSERT INTO rating_seasons (name, start_date, end_date, is_active)
SELECT 'Сезон 1', '2025-01-01', '2025-06-30', TRUE
WHERE NOT EXISTS (SELECT 1 FROM rating_seasons);

-- Комментарии
COMMENT ON TABLE rating_seasons IS 'Сезоны рейтинга для разделения турниров по временным периодам';
COMMENT ON COLUMN rating_seasons.name IS 'Название сезона';
COMMENT ON COLUMN rating_seasons.start_date IS 'Дата начала сезона';
COMMENT ON COLUMN rating_seasons.end_date IS 'Дата окончания сезона';
COMMENT ON COLUMN rating_seasons.is_active IS 'Активный сезон (может быть только один)';
COMMENT ON COLUMN games.season_id IS 'ID сезона, к которому привязан турнир';

