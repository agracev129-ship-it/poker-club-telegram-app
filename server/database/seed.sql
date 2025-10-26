-- Начальные данные для покерного клуба

-- Достижения
INSERT INTO achievements (name, description, icon, color, requirement_type, requirement_value) VALUES
('Первая победа', 'Выиграл турнир', 'trophy', 'yellow', 'games_won', 1),
('Активист', 'Сыграл 10 игр', 'zap', 'blue', 'games_played', 10),
('Легенда', 'Попал в топ-3', 'star', 'purple', 'rank', 3),
('Рост', '+5 позиций в рейтинге', 'trending-up', 'green', 'rank_improvement', 5),
('Новичок', 'Зарегистрировался в клубе', 'user', 'gray', 'games_played', 0),
('Профессионал', 'Сыграл 50 игр', 'target', 'red', 'games_played', 50),
('Чемпион', 'Выиграл 10 турниров', 'award', 'gold', 'games_won', 10)
ON CONFLICT DO NOTHING;

-- Игры (на следующие несколько дней)
INSERT INTO games (name, description, game_type, date, time, max_players, buy_in, status) VALUES
('TEXAS HOLDEM CLASSIC', 'Классический покер Texas Hold''em с бай-ином 5000₽. Стартовый стек 10,000 фишек. Уровни по 20 минут.', 'cash', CURRENT_DATE, '18:00', 60, 5000, 'upcoming'),
('OMAHA CHAMPIONSHIP', 'Pot-Limit Omaha чемпионат. Бай-ин 7500₽. Глубокие стеки и длинные уровни по 30 минут.', 'cash', CURRENT_DATE, '20:00', 50, 7500, 'upcoming'),
('DEEP STACK TURBO', 'Турбо-турнир с глубокими стеками. Бай-ин 3000₽. Стартовый стек 15,000 фишек. Уровни по 15 минут.', 'cash', CURRENT_DATE + 1, '19:30', 80, 3000, 'upcoming'),
('BOUNTY TOURNAMENT', 'Баунти-турнир с прогрессивными наградами. Бай-ин 6000₽. Получайте 1000₽ за каждого выбитого игрока.', 'cash', CURRENT_DATE + 1, '21:00', 40, 6000, 'upcoming'),
('FRIDAY NIGHT POKER', 'Пятничный покер. Texas Hold''em с увеличенным призовым фондом. Бай-ин 8000₽.', 'cash', CURRENT_DATE + 2, '20:00', 70, 8000, 'upcoming'),
('WEEKEND SPECIAL', 'Специальный турнир выходного дня. Омаха. Бай-ин 10000₽. Гарантированный призовой фонд 500,000₽.', 'cash', CURRENT_DATE + 3, '18:00', 100, 10000, 'upcoming'),
('SUNDAY CHAMPIONSHIP', 'Воскресный чемпионат. Texas Hold''em. Бай-ин 15000₽. Главный приз 200,000₽.', 'cash', CURRENT_DATE + 4, '19:00', 80, 15000, 'upcoming'),
('MONDAY MADNESS', 'Понедельник начинается с покера! Быстрый турнир. Бай-ин 4000₽.', 'cash', CURRENT_DATE + 5, '19:00', 50, 4000, 'upcoming')
ON CONFLICT DO NOTHING;

-- Турниры
INSERT INTO tournaments (name, description, prize_pool, date, time, max_players, buy_in, status) VALUES
('DEEP CLASSIC TOURNAMENT', 'Классический глубокий турнир Texas Hold''em. Длинные уровни по 30 минут. Гарантированный призовой фонд.', 50000, CURRENT_DATE, '19:00', 100, 5000, 'registration'),
('WEEKLY CHAMPIONSHIP', 'Еженедельный чемпионат клуба. Pot-Limit Omaha. Стартовый стек 15,000 фишек.', 25000, CURRENT_DATE + 3, '20:00', 80, 3000, 'upcoming'),
('MEGA BOUNTY SERIES', 'Серия баунти-турниров с прогрессивными наградами. За каждого выбитого игрока - 2000₽.', 100000, CURRENT_DATE + 5, '18:00', 200, 5000, 'upcoming'),
('MONTHLY MASTERS', 'Ежемесячный турнир мастеров. Только для игроков с рейтингом 2000+. Призовой фонд 150,000₽.', 150000, CURRENT_DATE + 10, '19:00', 50, 15000, 'upcoming'),
('SUPER SUNDAY', 'Главный турнир месяца. Texas Hold''em с реентрами. Гарантия 300,000₽.', 300000, CURRENT_DATE + 7, '18:00', 150, 10000, 'upcoming')
ON CONFLICT DO NOTHING;

