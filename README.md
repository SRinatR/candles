# 🕯️ Askim Candles - E-commerce Platform

> Современная платформа электронной коммерции для продажи ароматических свечей и предметов домашнего декора

## 🌟 Особенности проекта

### 🎯 Основной функционал
- **Многоязычная поддержка** - UZ (по умолчанию), RU, EN
- **Каталог продуктов** с фильтрацией и поиском
- **Корзина покупок** с сохранением в localStorage
- **Система аутентификации** через Google OAuth + NextAuth.js
- **Админ-панель** с ролевой системой доступа
- **Адаптивный дизайн** для всех устройств
- **Темная/светлая тема** в админ-панели

### 🏗️ Архитектура
- **Frontend**: React 19.1.0 + Next.js 15.3.3 (App Router)
- **Styling**: Tailwind CSS 4.x с кастомными темами
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js
- **UI Components**: Radix UI + shadcn/ui
- **Deployment**: Docker + Docker Compose

## 🚀 Быстрый старт

### Предварительные требования
- Node.js 18+ 
- npm или yarn
- PostgreSQL (для production)
- Docker (опционально)

### Установка и запуск

```bash
# Клонирование репозитория
git clone <repository-url>
cd Askim_candles

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env.local
# Отредактируйте .env.local с вашими настройками

# Запуск в режиме разработки
npm run dev
```

Приложение будет доступно по адресу: `http://localhost:9002`

### 🐳 Запуск с Docker

```bash
# Сборка и запуск контейнеров
docker-compose up --build

# Для production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

## 📁 Структура проекта

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/          # Многоязычные страницы
│   │   ├── admin/             # Админ-панель
│   │   └── api/               # API роуты
│   ├── components/            # React компоненты
│   │   ├── admin/            # Компоненты админ-панели
│   │   ├── layout/           # Компоненты макета
│   │   ├── products/         # Компоненты продуктов
│   │   └── ui/               # UI компоненты (shadcn/ui)
│   ├── contexts/             # React контексты
│   ├── dictionaries/         # Файлы переводов
│   ├── hooks/                # Кастомные хуки
│   └── lib/                  # Утилиты и конфигурация
├── prisma/                   # Схема базы данных
├── public/                   # Статические файлы
├── memory-bank/              # Документация проекта
└── docker-compose.yml        # Docker конфигурация
```

## 🔧 Конфигурация

### Переменные окружения

Создайте файл `.env.local` со следующими переменными:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/askim_candles"

# NextAuth.js
NEXTAUTH_URL="http://localhost:9002"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# File uploads
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=5242880
```

### База данных

```bash
# Генерация Prisma клиента
npx prisma generate

# Применение миграций
npx prisma migrate deploy

# Заполнение тестовыми данными
npx prisma db seed
```

## 🎨 Особенности UI/UX

### Основной сайт
- **Адаптивный дизайн** для мобильных и десктопных устройств
- **Интуитивная навигация** по категориям продуктов
- **Продвинутые фильтры** по цене, материалам, ароматам
- **Корзина покупок** с сохранением состояния
- **Многоязычный интерфейс** с переключением языков

### Админ-панель
- **Ограниченный доступ с мобильных** устройств (кроме входа)
- **Темная/светлая тема** с сохранением предпочтений
- **Управление продуктами** с загрузкой изображений
- **Система ролей** (ADMIN, MANAGER, USER)
- **Логирование действий** администраторов

## 🔐 Система аутентификации

### Основной сайт
- **Google OAuth** через NextAuth.js
- **Симулированная аутентификация** email/password (для разработки)
- **Защищенные роуты** для личного кабинета

### Админ-панель
- **Ролевая система** доступа
- **Отдельная аутентификация** от основного сайта
- **Автоматический редирект** неавторизованных пользователей

## 📊 API Endpoints

### Продукты
- `GET /api/products` - Список продуктов с фильтрацией
- `GET /api/products/[id]` - Детали продукта
- `POST /api/products` - Создание продукта (админ)
- `PUT /api/products/[id]` - Обновление продукта (админ)
- `DELETE /api/products/[id]` - Удаление продукта (админ)

### Категории
- `GET /api/categories` - Список категорий
- `GET /api/categories/[id]` - Детали категории

### Материалы и ароматы
- `GET /api/materials` - Список материалов
- `GET /api/scents` - Список ароматов

### Файлы
- `POST /api/upload` - Загрузка изображений

## 🛠️ Разработка

### Доступные команды

```bash
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка для production
npm run start        # Запуск production сборки
npm run lint         # Проверка кода ESLint
npm run type-check   # Проверка типов TypeScript
```

### Стандарты кодирования
- **TypeScript** в строгом режиме
- **ESLint** для проверки качества кода
- **Prettier** для форматирования
- **Функциональные компоненты** с хуками
- **Современный ES6+** синтаксис

## 📚 Memory Bank System

Проект использует уникальную систему документации **Memory Bank**:

- `memory-bank/projectbrief.md` - Обзор проекта
- `memory-bank/productContext.md` - Контекст продукта
- `memory-bank/activeContext.md` - Текущий фокус разработки
- `memory-bank/systemPatterns.md` - Архитектурные решения
- `memory-bank/techContext.md` - Технический контекст
- `memory-bank/progress.md` - Отслеживание прогресса
- `memory-bank/deployment_guide.md` - Руководство по развертыванию

## 🚀 Развертывание

### Production с Docker

1. **Настройка переменных окружения**
2. **Сборка образов**: `docker-compose build`
3. **Запуск сервисов**: `docker-compose up -d`
4. **Применение миграций**: `docker-compose exec app npx prisma migrate deploy`

### VPS развертывание

Подробное руководство доступно в `memory-bank/deployment_guide.md`

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции: `git checkout -b feature/amazing-feature`
3. Зафиксируйте изменения: `git commit -m 'Add amazing feature'`
4. Отправьте в ветку: `git push origin feature/amazing-feature`
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 📞 Поддержка

Для вопросов и поддержки:
- Создайте Issue в репозитории
- Обратитесь к документации в папке `memory-bank/`
- Проверьте существующие Issues перед созданием нового

---

**Askim Candles** - создавая уют в каждом доме 🕯️✨
