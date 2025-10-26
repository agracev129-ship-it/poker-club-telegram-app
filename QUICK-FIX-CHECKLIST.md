# ✅ Быстрый Чек-лист Исправлений

## Что нужно сделать (по порядку):

### □ 1. Создать файл .env
- [ ] Открыть папку `client`
- [ ] Создать файл `.env`
- [ ] Вставить: `VITE_API_URL=https://poker-club-backend-tb4h.onrender.com/api`
- [ ] Сохранить

### □ 2. Пересобрать проект
```powershell
cd c:\Users\grach\source\repos\NBKapp\poker-club-telegram-app\client
npm run build
```

### □ 3. Загрузить на GitHub
- [ ] Открыть GitHub Desktop
- [ ] Summary: `Fix players display and tournament registration`
- [ ] Нажать "Commit to main"
- [ ] Нажать "Push origin"

### □ 4. Настроить Render (Frontend)
- [ ] Открыть render.com
- [ ] Перейти в Frontend сервис
- [ ] Environment → Add Environment Variable
- [ ] Key: `VITE_API_URL`
- [ ] Value: `https://poker-club-backend-tb4h.onrender.com/api`
- [ ] Save Changes

### □ 5. Подождать деплоя (5-10 минут)

### □ 6. Протестировать:
- [ ] Открыть приложение
- [ ] Проверить вкладку "Игроки" - должны быть реальные пользователи
- [ ] Зарегистрироваться на турнир через "Турниры"
- [ ] Проверить вкладку "Посадка" - должна показать стол и место

---

## 🚨 Если что-то не работает:

**Игроки не отображаются?**
→ Проверьте, что файл `.env` создан и содержит правильный URL

**Посадка пустая?**
→ Убедитесь, что вы зарегистрированы на турнир

**Другие проблемы?**
→ Откройте `FIXES-COMPLETE.md` для подробных инструкций

