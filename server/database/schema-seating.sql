-- Таблица для рассадки игроков за столами

CREATE TABLE IF NOT EXISTS table_assignments (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    seat_number INTEGER NOT NULL CHECK (seat_number >= 1 AND seat_number <= 10),
    is_eliminated BOOLEAN DEFAULT FALSE,
    finish_place INTEGER,
    points_earned INTEGER DEFAULT 0,
    bonus_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (game_id, table_number, seat_number),
    UNIQUE (game_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_table_assignments_game_id ON table_assignments (game_id);
CREATE INDEX IF NOT EXISTS idx_table_assignments_user_id ON table_assignments (user_id);
CREATE INDEX IF NOT EXISTS idx_table_assignments_table ON table_assignments (game_id, table_number);
CREATE INDEX IF NOT EXISTS idx_table_assignments_eliminated ON table_assignments (game_id, is_eliminated);

-- Добавляем новые поля к играм для статуса турнира
ALTER TABLE games ADD COLUMN IF NOT EXISTS tournament_status VARCHAR(20) DEFAULT 'upcoming';
-- upcoming, started, finished

-- Обновляем существующие игры
UPDATE games SET tournament_status = 'upcoming' WHERE tournament_status IS NULL;

COMMENT ON TABLE table_assignments IS 'Рассадка игроков за столами в турнирах';
COMMENT ON COLUMN table_assignments.table_number IS 'Номер стола (1, 2, 3...)';
COMMENT ON COLUMN table_assignments.seat_number IS 'Номер места за столом (1-10)';
COMMENT ON COLUMN table_assignments.is_eliminated IS 'Выбыл ли игрок из турнира';
COMMENT ON COLUMN table_assignments.finish_place IS 'Итоговое место в турнире';
COMMENT ON COLUMN table_assignments.points_earned IS 'Очки за место в турнире';
COMMENT ON COLUMN table_assignments.bonus_points IS 'Бонусные очки от администратора';



