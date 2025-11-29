-- ====================================================================
-- ПРОВЕРКА СИСТЕМЫ СЕЗОНОВ РЕЙТИНГА
-- ====================================================================
-- Этот скрипт проверяет, что турниры правильно связаны с сезонами
-- и очки начисляются корректно
-- ====================================================================

-- 1. Проверяем существующие сезоны
SELECT 
  id,
  name,
  start_date,
  end_date,
  is_active,
  created_at
FROM rating_seasons
ORDER BY id;

-- 2. Проверяем турниры и их привязку к сезонам
SELECT 
  g.id as game_id,
  g.name as game_name,
  g.date as game_date,
  g.status,
  g.season_id,
  rs.name as season_name
FROM games g
LEFT JOIN rating_seasons rs ON g.season_id = rs.id
ORDER BY g.id DESC
LIMIT 20;

-- 3. Проверяем начисление очков в каждом сезоне
SELECT 
  rs.id as season_id,
  rs.name as season_name,
  COUNT(DISTINCT g.id) as total_games,
  COUNT(DISTINCT gr.user_id) as total_players,
  SUM(gr.points_earned) as total_points_awarded
FROM rating_seasons rs
LEFT JOIN games g ON g.season_id = rs.id
LEFT JOIN game_registrations gr ON gr.game_id = g.id AND gr.status = 'participated'
GROUP BY rs.id, rs.name
ORDER BY rs.id;

-- 4. Проверяем рейтинг игроков по конкретному сезону (замените X на ID сезона)
-- Пример для сезона с ID = 2:
WITH season_stats AS (
  SELECT 
    gr.user_id,
    COUNT(DISTINCT g.id) as games_played,
    SUM(gr.points_earned) as total_points,
    SUM(CASE WHEN ta.finish_place = 1 THEN 1 ELSE 0 END) as wins
  FROM game_registrations gr
  JOIN games g ON gr.game_id = g.id
  LEFT JOIN table_assignments ta ON gr.game_id = ta.game_id AND gr.user_id = ta.user_id
  WHERE g.season_id = 2  -- ИЗМЕНИТЕ НА НУЖНЫЙ ID СЕЗОНА
    AND gr.status = 'participated'
    AND gr.points_earned IS NOT NULL
  GROUP BY gr.user_id
)
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  COALESCE(ss.games_played, 0) as games_played,
  COALESCE(ss.total_points, 0) as total_points,
  COALESCE(ss.wins, 0) as games_won,
  ROW_NUMBER() OVER (ORDER BY COALESCE(ss.total_points, 0) DESC) as rank
FROM users u
LEFT JOIN season_stats ss ON u.id = ss.user_id
WHERE ss.games_played > 0
ORDER BY total_points DESC
LIMIT 20;

-- 5. Проверяем детали конкретного завершенного турнира
SELECT 
  g.id as game_id,
  g.name as game_name,
  g.season_id,
  rs.name as season_name,
  u.first_name || ' ' || COALESCE(u.last_name, '') as player_name,
  gr.points_earned,
  ta.finish_place
FROM games g
LEFT JOIN rating_seasons rs ON g.season_id = rs.id
JOIN game_registrations gr ON gr.game_id = g.id
JOIN users u ON gr.user_id = u.id
LEFT JOIN table_assignments ta ON ta.game_id = g.id AND ta.user_id = u.id
WHERE g.status = 'finished'
  AND gr.status = 'participated'
ORDER BY g.id DESC, ta.finish_place ASC
LIMIT 30;

