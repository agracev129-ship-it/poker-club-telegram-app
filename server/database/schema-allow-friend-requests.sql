-- Добавляем поле allow_friend_requests в таблицу users
-- По умолчанию true - все пользователи могут получать запросы в друзья

ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_friend_requests BOOLEAN DEFAULT TRUE;

-- Устанавливаем значение по умолчанию для всех существующих пользователей
UPDATE users SET allow_friend_requests = TRUE WHERE allow_friend_requests IS NULL;

-- Создаем индекс для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_users_allow_friend_requests ON users(allow_friend_requests);

COMMENT ON COLUMN users.allow_friend_requests IS 'Разрешает другим пользователям отправлять запросы в друзья. По умолчанию true.';

