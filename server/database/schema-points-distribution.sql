-- Добавляем поле для выбора режима начисления очков в турнире
-- 'manual' - ручное (админ заранее прописывает очки для каждого места)
-- 'default' - по умолчанию (автоматический расчет: 75 очков от каждого игрока, распределение по процентам)

ALTER TABLE games ADD COLUMN IF NOT EXISTS points_distribution_mode VARCHAR(20) DEFAULT 'default' CHECK (points_distribution_mode IN ('manual', 'default'));

-- Устанавливаем значение по умолчанию для всех существующих турниров
UPDATE games SET points_distribution_mode = 'default' WHERE points_distribution_mode IS NULL;

-- Создаем индекс для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_games_points_distribution_mode ON games(points_distribution_mode);

COMMENT ON COLUMN games.points_distribution_mode IS 'Режим начисления очков: manual (ручной) или default (автоматический расчет по процентам от банка)';

