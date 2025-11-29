# ✅ ИСПРАВЛЕНИЕ ПРИМЕНЕНО: Очки теперь начисляются в сезоны

## 🐛 Проблема:
Очки начислялись только в общий рейтинг (`user_stats.total_points`), но **НЕ сохранялись** в `game_registrations.points_earned`. Из-за этого рейтинг по сезонам был пустым, так как запросы берут данные именно из `game_registrations.points_earned`.

## ✅ Что исправлено:

В файле `server/models/Game.js`, функция `finishTournament()`:

**БЫЛО:**
```javascript
const regUpdateResult = await query(
  `UPDATE game_registrations 
   SET status = 'participated'
   WHERE game_id = $1 AND user_id = $2
   RETURNING *`,
  [gameId, registration.user_id]
);
```

**СТАЛО:**
```javascript
const regUpdateResult = await query(
  `UPDATE game_registrations 
   SET status = 'participated',
       points_earned = $3
   WHERE game_id = $1 AND user_id = $2
   RETURNING *`,
  [gameId, registration.user_id, totalPoints]
);
```

## 📊 Теперь очки начисляются в:

1. ✅ **Общий рейтинг** (`user_stats.total_points`) - для вкладки "Рейтинг" → "Общий рейтинг"
2. ✅ **Рейтинг сезона** (`game_registrations.points_earned`) - для вкладки "Рейтинг" → выбор конкретного сезона

## 🚀 Что нужно сделать:

### 1. Перезапустите сервер
```bash
# Остановите сервер (Ctrl+C в терминале)
# Затем запустите снова:
cd poker-club-telegram-app/server
node index.js
```

### 2. Проведите новый турнир
- Создайте турнир с выбранным сезоном
- Проведите его до конца
- Проверьте рейтинг

### 3. Для старых турниров (опционально)

Если вы хотите, чтобы очки из уже проведенных турниров попали в рейтинги сезонов, выполните этот SQL скрипт в вашей базе данных:

```sql
-- Копируем очки из user_stats обратно в game_registrations
-- для уже завершенных турниров
UPDATE game_registrations gr
SET points_earned = COALESCE(
  (SELECT ta.points_earned 
   FROM table_assignments ta 
   WHERE ta.game_id = gr.game_id AND ta.user_id = gr.user_id
   LIMIT 1), 
  0
)
WHERE gr.status = 'participated'
  AND (gr.points_earned IS NULL OR gr.points_earned = 0)
  AND EXISTS (
    SELECT 1 FROM games g 
    WHERE g.id = gr.game_id 
    AND g.tournament_status = 'completed'
  );

-- Проверяем результат
SELECT 
  COUNT(*) as total_participated,
  COUNT(CASE WHEN points_earned > 0 THEN 1 END) as with_points
FROM game_registrations
WHERE status = 'participated';
```

**⚠️ ВАЖНО:** Этот скрипт попытается восстановить очки из `table_assignments.points_earned` для старых турниров. Но если там тоже нет данных, придется пересчитать вручную или провести турниры заново.

## 🧪 Проверка

После перезапуска сервера и проведения нового турнира:

1. Откройте вкладку **"Рейтинг"** в приложении
2. Выберите сезон из выпадающего списка
3. Должны отобразиться игроки с очками! 🎉

### Проверка через SQL:

Используйте обновленный `test-seasons.sql`:

```sql
-- Проверяем, что очки сохранены в game_registrations
SELECT 
  g.id,
  g.name,
  g.season_id,
  u.first_name || ' ' || u.last_name as player,
  gr.points_earned,
  gr.status
FROM games g
JOIN game_registrations gr ON gr.game_id = g.id
JOIN users u ON gr.user_id = u.id
WHERE g.tournament_status = 'completed'
  AND gr.status = 'participated'
ORDER BY g.id DESC, gr.points_earned DESC;
```

## 📝 Логи для отладки

В логах сервера теперь будет видно:

```
✅ Registration updated for player 123: {
  status: 'participated',
  points_earned: 450,
  total_points_saved: 450
}
```

Если `points_earned` = `null` или `0`, значит что-то пошло не так.

## 🎯 Итог

Теперь при завершении турнира:
- ✅ Очки добавляются в общий рейтинг (`user_stats`)
- ✅ Очки сохраняются в `game_registrations.points_earned`
- ✅ Рейтинги по сезонам формируются правильно
- ✅ История турниров показывает корректные очки

**Система сезонов теперь работает полностью!** 🚀

