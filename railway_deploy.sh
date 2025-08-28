#!/bin/bash
# Скрипт для развертывания TOSIOS на Railway
# Использование: ./railway_deploy.sh

echo "🚂 Начинаем развертывание TOSIOS на Railway..."

# Проверяем наличие railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI не установлен. Установите его:"
    echo "npm install -g @railway/cli"
    echo "или"
    echo "curl -fsSL https://railway.app/install.sh | sh"
    exit 1
fi

# Проверяем авторизацию
if ! railway whoami &> /dev/null; then
    echo "🔐 Необходимо авторизоваться в Railway:"
    railway login
fi

# Создаем новый проект или подключаемся к существующему
echo "📦 Создаем/подключаемся к Railway проекту..."
if [ -f "railway.json" ]; then
    railway init --name "tosios-game" --source . || railway link
else
    echo "❌ railway.json не найден!"
    exit 1
fi

# Добавляем переменные окружения
echo "⚙️  Настраиваем переменные окружения..."
railway variables set NODE_ENV=production
railway variables set PORT=3001

# Деплоим
echo "🚀 Выполняем развертывание..."
railway up

# Получаем URL
echo "🌐 Получаем URL развернутого приложения..."
railway domain

echo ""
echo "✅ Развертывание завершено!"
echo "🎮 Ваша игра TOSIOS доступна по указанному выше URL"
