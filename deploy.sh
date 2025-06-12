#!/bin/bash

# Скрипт для развертывания Askim Candles с помощью Docker

echo "🚀 Начинаем развертывание Askim Candles..."

# Проверка наличия Docker и Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Пожалуйста, установите Docker."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Пожалуйста, установите Docker Compose."
    exit 1
fi

# Создание .env файла из примера, если его нет
if [ ! -f .env ]; then
    echo "📝 Создаем .env файл из .env.example..."
    cp .env.example .env
    echo "⚠️  Пожалуйста, отредактируйте .env файл и добавьте свои значения!"
    echo "   После редактирования запустите скрипт снова."
    exit 1
fi

# Создание необходимых директорий
echo "📁 Создаем необходимые директории..."
mkdir -p nginx/sites-enabled
mkdir -p nginx/ssl

# Проверка наличия SSL сертификатов
if [ ! -f nginx/ssl/fullchain.pem ] || [ ! -f nginx/ssl/privkey.pem ]; then
    echo "⚠️  SSL сертификаты не найдены в nginx/ssl/"
    echo "   Для HTTPS необходимо добавить:"
    echo "   - nginx/ssl/fullchain.pem"
    echo "   - nginx/ssl/privkey.pem"
    echo "   Или используйте Let's Encrypt для их получения."
fi

# Остановка существующих контейнеров
echo "🛑 Останавливаем существующие контейнеры..."
docker-compose down

# Сборка и запуск в режиме production
echo "🔨 Собираем Docker образы..."
docker-compose build --no-cache

# Запуск контейнеров
echo "🚀 Запускаем контейнеры..."
docker-compose up -d

# Ожидание запуска PostgreSQL
echo "⏳ Ожидаем запуск PostgreSQL..."
sleep 10

# Выполнение миграций Prisma
echo "🗄️  Выполняем миграции базы данных..."
docker-compose exec app npx prisma migrate deploy

# Генерация Prisma Client
echo "🔧 Генерируем Prisma Client..."
docker-compose exec app npx prisma generate

# Проверка статуса контейнеров
echo "✅ Проверяем статус контейнеров..."
docker-compose ps

echo "🎉 Развертывание завершено!"
echo ""
echo "📌 Полезные команды:"
echo "   docker-compose logs -f app     # Просмотр логов приложения"
echo "   docker-compose logs -f postgres # Просмотр логов БД"
echo "   docker-compose restart app      # Перезапуск приложения"
echo "   docker-compose down             # Остановка всех контейнеров"
echo ""
echo "🌐 Приложение доступно по адресу: http://localhost:3000"
echo "🔐 Админ панель: http://localhost:3000/admin"