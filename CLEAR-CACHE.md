# 🧹 ОЧИСТКА КЭША ПРОЕКТА

## Быстрая очистка кэша

### Вариант 1: PowerShell (Windows)

```powershell
# Перейти в директорию клиента
cd poker-club-telegram-app\client

# Очистить кэш сборки
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue

# Очистить кэш npm (опционально)
npm cache clean --force

# Пересобрать проект
npm run build
```

---

### Вариант 2: Командная строка (Windows)

```cmd
cd poker-club-telegram-app\client
rmdir /s /q dist
rmdir /s /q node_modules\.vite
npm cache clean --force
npm run build
```

---

### Вариант 3: Полная очистка (если ничего не помогает)

```powershell
# Перейти в директорию клиента
cd poker-club-telegram-app\client

# Удалить все кэши и зависимости
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Очистить кэш npm
npm cache clean --force

# Переустановить зависимости
npm install

# Пересобрать проект
npm run build
```

---

## Что очищается:

- **`dist/`** - папка со скомпилированным кодом
- **`node_modules/.vite/`** - кэш Vite
- **`package-lock.json`** - файл блокировки зависимостей (при полной очистке)
- **`node_modules/`** - все зависимости (при полной очистке)
- **npm cache** - кэш npm

---

## После очистки:

1. ✅ Запустите `npm install` (если удалили `node_modules`)
2. ✅ Запустите `npm run build` для пересборки
3. ✅ Закоммитьте изменения и запушьте на GitHub

---

## Быстрая команда (копировать целиком):

```powershell
cd poker-club-telegram-app\client; Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue; Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue; npm cache clean --force; npm run build
```

