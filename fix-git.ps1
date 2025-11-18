# Скрипт для исправления проблем с Git коммитом

Write-Host "🔍 Проверка статуса Git..." -ForegroundColor Cyan

# Переход в директорию проекта
Set-Location $PSScriptRoot

# Проверка, что мы в правильной директории
if (-not (Test-Path ".git")) {
    Write-Host "❌ Ошибка: .git не найден. Убедитесь, что вы в корне репозитория." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Репозиторий найден" -ForegroundColor Green

# Проверка статуса
Write-Host "`n📋 Статус Git:" -ForegroundColor Cyan
git status

# Проверка размера файлов
Write-Host "`n📊 Проверка размера файлов..." -ForegroundColor Cyan
$largeFiles = Get-ChildItem -Recurse -File | Where-Object { $_.Length -gt 10MB } | Select-Object FullName, @{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB,2)}}
if ($largeFiles) {
    Write-Host "⚠️  Найдены большие файлы (>10MB):" -ForegroundColor Yellow
    $largeFiles | Format-Table -AutoSize
    Write-Host "💡 Убедитесь, что эти файлы в .gitignore" -ForegroundColor Yellow
} else {
    Write-Host "✅ Больших файлов не найдено" -ForegroundColor Green
}

# Проверка node_modules
Write-Host "`n📦 Проверка node_modules..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Write-Host "⚠️  node_modules найден. Убедитесь, что он в .gitignore" -ForegroundColor Yellow
} else {
    Write-Host "✅ node_modules не найден (хорошо)" -ForegroundColor Green
}

if (Test-Path "client/node_modules") {
    Write-Host "⚠️  client/node_modules найден. Убедитесь, что он в .gitignore" -ForegroundColor Yellow
} else {
    Write-Host "✅ client/node_modules не найден (хорошо)" -ForegroundColor Green
}

# Проверка dist
Write-Host "`n📁 Проверка dist..." -ForegroundColor Cyan
if (Test-Path "client/dist") {
    Write-Host "⚠️  client/dist найден. Убедитесь, что он в .gitignore" -ForegroundColor Yellow
} else {
    Write-Host "✅ client/dist не найден (хорошо)" -ForegroundColor Green
}

Write-Host "`n✅ Проверка завершена!" -ForegroundColor Green
Write-Host "`n💡 Следующие шаги:" -ForegroundColor Cyan
Write-Host "1. Откройте GitHub Desktop" -ForegroundColor White
Write-Host "2. Проверьте, что в коммите только нужные файлы" -ForegroundColor White
Write-Host "3. Убедитесь, что node_modules и dist НЕ в коммите" -ForegroundColor White
Write-Host "4. Попробуйте коммит снова" -ForegroundColor White


