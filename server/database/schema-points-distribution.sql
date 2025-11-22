-- Добавляем поле для выбора режима начисления очков в турнире
-- 'manual' - ручное (админ заранее прописывает очки для каждого места)
-- 'default' - по умолчанию (автоматический расчет: 75 очков от каждого игрока, распределение по процентам)

-- Сначала добавляем колонку без constraint
ALTER TABLE games ADD COLUMN IF NOT EXISTS points_distribution_mode VARCHAR(20);

-- Устанавливаем значение по умолчанию для всех существующих турниров
UPDATE games SET points_distribution_mode = 'default' WHERE points_distribution_mode IS NULL OR points_distribution_mode = '';

-- Теперь добавляем constraint и default
DO $$ 
BEGIN
  -- Удаляем старый constraint если существует
  ALTER TABLE games DROP CONSTRAINT IF EXISTS games_points_distribution_mode_check;
  
  -- Добавляем новый constraint
  ALTER TABLE games ADD CONSTRAINT games_points_distribution_mode_check 
    CHECK (points_distribution_mode IN ('manual', 'default'));
    
  -- Устанавливаем default для будущих записей
  ALTER TABLE games ALTER COLUMN points_distribution_mode SET DEFAULT 'default';
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Игнорируем ошибки если constraint уже существует
END $$;

-- Создаем индекс для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_games_points_distribution_mode ON games(points_distribution_mode);

COMMENT ON COLUMN games.points_distribution_mode IS 'Режим начисления очков: manual (ручной) или default (автоматический расчет по процентам от банка)';

