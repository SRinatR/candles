# 🤖 Claude Debugging & Development Guide

> Этот файл содержит важную информацию для Claude AI при работе с проектом Askim Candles

## 🎯 Цель проекта

**Askim Candles** - современная e-commerce платформа для продажи ароматических свечей и предметов домашнего декора с фокусом на корпоративных клиентов.

## 📚 Memory Bank System (КРИТИЧЕСКИ ВАЖНО)

### Обязательные файлы для чтения перед любой задачей:
```
memory-bank/
├── projectbrief.md        # Основа проекта - ЧИТАТЬ ПЕРВЫМ
├── productContext.md      # Контекст продукта и бизнес-логика
├── activeContext.md       # Текущий фокус работы - ОБНОВЛЯТЬ ПОСЛЕ ЗАДАЧ
├── systemPatterns.md      # Архитектурные решения
├── techContext.md         # Технический контекст
├── progress.md            # Статус проекта - ОБНОВЛЯТЬ ПОСЛЕ ЗАДАЧ
└── deployment_guide.md    # Руководство по развертыванию
```

### ⚠️ ОБЯЗАТЕЛЬНЫЕ действия:
1. **Перед началом работы**: Прочитать ВСЕ файлы memory-bank/
2. **После завершения**: Обновить activeContext.md с изменениями
3. **После завершения**: Обновить progress.md с новым статусом
4. **При изменении архитектуры**: Обновить systemPatterns.md
5. **При изменении технологий**: Обновить techContext.md

## 🏗️ Текущая архитектура

### Технологический стек:
- **Frontend**: React 19.1.0 + Next.js 15.3.3 (App Router)
- **Styling**: Tailwind CSS 4.x
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js + Google OAuth
- **UI**: Radix UI + shadcn/ui
- **Deployment**: Docker + Docker Compose

### Структура проекта:
```
src/
├── app/[locale]/          # Многоязычные страницы (UZ/RU/EN)
├── app/admin/             # Админ-панель
├── app/api/               # API роуты
├── components/            # React компоненты
├── contexts/              # React контексты
├── dictionaries/          # Файлы переводов
├── hooks/                 # Кастомные хуки
└── lib/                   # Утилиты и конфигурация
```

## 🔧 Важные файлы конфигурации

### Сохранены в репозитории для отладки:
- `package.json` - зависимости и скрипты
- `next.config.ts` - конфигурация Next.js
- `tailwind.config.ts` - конфигурация Tailwind CSS
- `tsconfig.json` - конфигурация TypeScript
- `prisma/schema.prisma` - схема базы данных
- `docker-compose.yml` - конфигурация Docker
- `.env.example` - пример переменных окружения
- `components.json` - конфигурация shadcn/ui

## 🚨 Критические правила разработки

### React 19.1 специфика:
```typescript
// ПРАВИЛЬНО для React 19.1:
<Checkbox
  checked={selectedItems.includes(item)}
  onCheckedChange={(checked) => {
    if (checked === true) {
      setSelectedItems(prev => [...prev, item]);
    } else {
      setSelectedItems(prev => prev.filter(i => i !== item));
    }
  }}
/>

// useParams с optional chaining:
const params = useParams();
const locale = (params?.locale as Locale) || 'uz';
```

### Tailwind CSS 4.x:
- Использовать новый синтаксис конфигурации
- CSS переменные в hex формате, не HSL
- Поддержка темной/светлой темы

### TypeScript строгий режим:
- Всегда типизировать props и state
- Использовать `import type` для типов
- Избегать `any` типов

## 🎨 UI/UX Паттерны

### Основной сайт:
- Адаптивный дизайн для всех устройств
- Многоязычность (UZ по умолчанию, RU, EN)
- Корзина с localStorage
- Фильтрация продуктов

### Админ-панель:
- Ограниченный доступ с мобильных (кроме входа)
- Темная/светлая тема
- Ролевая система (ADMIN/MANAGER/USER)
- Логирование действий

## 🔐 Система аутентификации

### Основной сайт:
- Google OAuth через NextAuth.js
- Симулированная email/password аутентификация

### Админ-панель:
- Отдельная система аутентификации
- Ролевый доступ
- Защищенные роуты

## 📊 API Endpoints

```
GET  /api/products         # Список продуктов с фильтрацией
GET  /api/products/[id]    # Детали продукта
GET  /api/categories       # Список категорий
GET  /api/materials        # Список материалов
GET  /api/scents          # Список ароматов
POST /api/upload          # Загрузка файлов
```

## 🐛 Известные проблемы и решения

### Если сборка не работает:
1. Проверить совместимость React 19.1 + Next.js 15.3.3
2. Убедиться в правильности Tailwind CSS 4.x конфигурации
3. Проверить типизацию компонентов

### Если компоненты не работают:
1. Проверить onCheckedChange handlers в Checkbox
2. Убедиться в правильности useParams usage
3. Проверить форм-компоненты с React Hook Form

## 🚀 Команды разработки

```bash
npm run dev          # Запуск dev сервера (порт 9002)
npm run build        # Сборка для production
npm run start        # Запуск production сборки
npm run lint         # Проверка ESLint
npx prisma generate  # Генерация Prisma клиента
npx prisma migrate   # Применение миграций
```

## 🐳 Docker команды

```bash
docker-compose up --build              # Сборка и запуск
docker-compose exec app npx prisma migrate deploy  # Миграции в контейнере
```

## 📝 Стандарты кодирования

- **Функциональные компоненты** с хуками
- **TypeScript** в строгом режиме
- **ESLint** для проверки качества
- **Современный ES6+** синтаксис
- **Никаких console.log** в production
- **Описательные имена** переменных

## 🔍 Отладка и тестирование

### Проверка работоспособности:
1. `npm run dev` должен запускаться без ошибок
2. `npm run build` должен проходить успешно
3. Все формы должны работать
4. Фильтрация продуктов должна функционировать
5. Переключение языков должно работать

### Логи и ошибки:
- Проверять консоль браузера на ошибки
- Следить за TypeScript ошибками
- Проверять Network tab для API запросов

## 📋 Чек-лист перед коммитом

- [ ] Прочитаны все файлы memory-bank/
- [ ] Код соответствует стандартам проекта
- [ ] TypeScript компилируется без ошибок
- [ ] ESLint проверки пройдены
- [ ] Функциональность протестирована
- [ ] Memory Bank файлы обновлены
- [ ] Документация актуализирована

## 🎯 Приоритеты разработки

1. **Стабильность** - все должно работать без ошибок
2. **Совместимость** - React 19.1 + Next.js 15.3.3 + Tailwind 4.x
3. **Производительность** - оптимизация сборки и рендеринга
4. **UX** - улучшение пользовательского опыта
5. **Функциональность** - добавление новых возможностей

---

**Помни**: Memory Bank система - это сердце проекта. Всегда читай и обновляй документацию!