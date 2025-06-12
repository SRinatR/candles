# Docker Deployment Guide for Askim Candles

## 🚀 Быстрый старт

### 1. Подготовка окружения

1. Убедитесь, что у вас установлены:
   - Docker (версия 20.10+)
   - Docker Compose (версия 2.0+)

2. Клонируйте проект и перейдите в директорию:
```bash
cd askim-candles
```

3. Создайте `.env` файл из примера:
```bash
cp .env.example .env
```

4. Отредактируйте `.env` файл, добавив свои значения:
```bash
nano .env  # или используйте любой другой редактор
```

### 2. Запуск приложения

Используйте готовый скрипт развертывания:
```bash
chmod +x deploy.sh
./deploy.sh
```

Или выполните команды вручную:
```bash
# Сборка и запуск контейнеров
docker-compose up -d --build

# Выполнение миграций базы данных
docker-compose exec app npx prisma migrate deploy
```

### 3. Проверка работы

- Основной сайт: http://localhost:3000
- Админ панель: http://localhost:3000/admin
- PostgreSQL: localhost:5432

## 📋 Структура Docker

### Контейнеры

1. **app** - Next.js приложение
   - Порт: 3000
   - Автоматический перезапуск при сбое
   - Включает Prisma ORM

2. **postgres** - База данных PostgreSQL
   - Порт: 5432
   - Постоянное хранилище данных
   - Автоматические health checks

3. **nginx** - Reverse proxy (опционально)
   - Порты: 80, 443
   - SSL/TLS поддержка
   - Кеширование статики

### Volumes

- `postgres_data` - данные PostgreSQL
- `uploaded_files` - загруженные файлы
- `nginx_logs` - логи Nginx

## 🔧 Управление

### Основные команды

```bash
# Просмотр логов
docker-compose logs -f app
docker-compose logs -f postgres

# Перезапуск сервисов
docker-compose restart app
docker-compose restart postgres

# Остановка всех сервисов
docker-compose down

# Остановка с удалением volumes (ВНИМАНИЕ: удалит все данные!)
docker-compose down -v
```

### Работа с базой данных

```bash
# Создание новой миграции
docker-compose exec app npx prisma migrate dev --name migration_name

# Применение миграций
docker-compose exec app npx prisma migrate deploy

# Открыть Prisma Studio
docker-compose exec app npx prisma studio
```

### Обновление приложения

```bash
# Остановить контейнеры
docker-compose down

# Получить последние изменения (если используете git)
git pull

# Пересобрать и запустить
docker-compose up -d --build

# Применить миграции
docker-compose exec app npx prisma migrate deploy
```

## 🔐 Безопасность

### SSL Сертификаты

Для HTTPS необходимо:

1. Получить SSL сертификаты (например, через Let's Encrypt)
2. Поместить их в `nginx/ssl/`:
   - `fullchain.pem` - полная цепочка сертификатов
   - `privkey.pem` - приватный ключ

### Переменные окружения

Обязательно измените в `.env`:
- `POSTGRES_PASSWORD` - надежный пароль для БД
- `NEXTAUTH_SECRET` - случайная строка (32+ символа)
- `NEXTAUTH_URL` - ваш домен

Генерация секрета для NextAuth:
```bash
openssl rand -base64 32
```

## 🚨 Решение проблем

### Приложение не запускается

1. Проверьте логи:
```bash
docker-compose logs app
```

2. Убедитесь, что все переменные окружения установлены
3. Проверьте, что порты не заняты другими приложениями

### Ошибки базы данных

1. Проверьте подключение к БД:
```bash
docker-compose exec postgres psql -U askim_user -d askim_candles_prod
```

2. Проверьте миграции:
```bash
docker-compose exec app npx prisma migrate status
```

### Проблемы с памятью

Если контейнеры падают из-за нехватки памяти:

1. Проверьте использование ресурсов:
```bash
docker stats
```

2. Увеличьте лимиты в `docker-compose.yml`:
```yaml
app:
  deploy:
    resources:
      limits:
        memory: 1G
```

## 📊 Мониторинг

### Просмотр использования ресурсов
```bash
docker stats
```

### Проверка здоровья контейнеров
```bash
docker-compose ps
```

### Backup базы данных
```bash
# Создание дампа
docker-compose exec postgres pg_dump -U askim_user askim_candles_prod > backup.sql

# Восстановление из дампа
docker-compose exec -T postgres psql -U askim_user askim_candles_prod < backup.sql
```

## 🔄 CI/CD рекомендации

Для автоматического развертывания:

1. Используйте Docker Hub или GitLab Registry для хранения образов
2. Настройте GitHub Actions или GitLab CI для автоматической сборки
3. Используйте Docker Swarm или Kubernetes для production

## 📝 Дополнительные настройки

### Изменение портов

В `docker-compose.yml`:
```yaml
app:
  ports:
    - "8080:3000"  # Изменить внешний порт на 8080
```

### Добавление Redis (для кеширования)

Добавьте в `docker-compose.yml`:
```yaml
redis:
  image: redis:alpine
  container_name: askim_redis
  restart: unless-stopped
  networks:
    - askim_network
```

### Настройка email

Добавьте в `.env`:
```
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email@gmail.com
EMAIL_SERVER_PASSWORD=your_app_password
```