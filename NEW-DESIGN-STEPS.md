# 🚀 Обновление дизайна - Пошаговая инструкция

## ✨ Что добавлено:
✅ Пользовательское соглашение при первом запуске  
✅ Настройки профиля (аватарка, имя, уведомления)  
✅ Switch компонент для настроек  
✅ **ВСЯ функциональность сохранена!**

---

## 📋 Что делать СЕЙЧАС (4 шага):

### 1️⃣ Установить новые зависимости (2 минуты)
```powershell
cd c:\Users\grach\source\repos\NBKapp\poker-club-telegram-app\client
npm install
```

### 2️⃣ Пересобрать проект (1 минута)
```powershell
npm run build
```
Подождите сообщения "built in ... seconds"

### 3️⃣ Загрузить на GitHub (2 минуты)
**GitHub Desktop:**
- Summary: `Add Terms of Service and Settings view`
- Description: `Added Terms and Conditions screen, Settings view in Profile, all functionality preserved`
- **Commit to main** → **Push origin**

### 4️⃣ Подождать деплоя (5-10 минут)
Render автоматически обновит приложение

---

## ✅ Как проверить:

### Новые функции:
1. **Соглашение:** Очистите localStorage → Обновите страницу → Должно показать соглашение
2. **Настройки:** Профиль → Иконка шестеренки → Должен открыться экран настроек

### Старая функциональность:
1. **Турниры** → Кнопка регистрации работает ✅
2. **Игроки** → Список отображается ✅
3. **Посадка** → Показывает стол и место ✅
4. **Рейтинг** → Таблица работает ✅

---

## 📁 Измененные файлы:

**Новые:**
- `client/src/components/TermsAndConditions.tsx`
- `client/src/components/SettingsView.tsx`
- `client/src/components/ui/switch.tsx`

**Обновленные:**
- `client/src/App.tsx`
- `client/src/components/ProfileTab.tsx`
- `client/package.json`

---

## 🆘 Если что-то не работает:

**Ошибки при npm install:**
- Удалите `node_modules`: `rm -r node_modules`
- Установите заново: `npm install`

**Ошибки при build:**
- Проверьте, что файл `.env` существует
- Содержимое: `VITE_API_URL=https://poker-club-backend-tb4h.onrender.com/api`

**Старая функциональность не работает:**
- Проверьте логи в консоли браузера (F12)
- Проверьте, что таблица `friendships` создана на backend
- Если нужно - выполните `node init-friends-table.js` на Render Shell

---

## 🎉 Готово!

Новый дизайн добавлен, вся функциональность сохранена!

**Начинайте с шага 1! 🚀**

