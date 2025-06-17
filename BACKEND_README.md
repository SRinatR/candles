<!-- BACKEND_README.md -->
# Backend API Documentation

## Настройка базы данных

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка переменных окружения
Скопируйте `.env.example` в `.env` и настройте переменные:
```bash
cp .env.example .env
```

Обновите `DATABASE_URL` в файле `.env`:
```
DATABASE_URL="postgresql://username:password@localhost:5432/askim_candles?schema=public"
```

### 3. Генерация Prisma клиента
```bash
npm run db:generate
```

### 4. Создание базы данных
```bash
npm run db:push
```

### 5. Заполнение тестовыми данными
```bash
npm run db:seed
```

## API Endpoints

### Products API

#### GET /api/products
Получение списка продуктов с фильтрацией и пагинацией.

**Query параметры:**
- `page` (number): Номер страницы (по умолчанию: 1)
- `limit` (number): Количество элементов на странице (по умолчанию: 10)
- `search` (string): Поиск по названию
- `category` (string): Фильтр по категории (slug)
- `material` (string): Фильтр по материалу
- `scent` (string): Фильтр по аромату
- `minPrice` (number): Минимальная цена
- `maxPrice` (number): Максимальная цена
- `inStock` (boolean): Только товары в наличии
- `locale` (string): Язык для переводов (uz, ru, en)

**Пример запроса:**
```
GET /api/products?page=1&limit=10&category=scented-candles&locale=ru
```

#### POST /api/products
Создание нового продукта.

**Body:**
```json
{
  "sku": "ASKM-NEW-001",
  "price": 30000,
  "costPrice": 20000,
  "dimensions": "10x10x12 см",
  "burningTime": "50 часов",
  "stock": 25,
  "categoryId": "category-id",
  "materialId": "material-id",
  "scentId": "scent-id",
  "translations": [
    {
      "locale": "ru",
      "name": "Новая свеча",
      "description": "Описание новой свечи"
    }
  ],
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "isMain": true,
      "order": 0
    }
  ],
  "attributes": [
    {
      "key": "Фитиль",
      "value": "Хлопковый"
    }
  ]
}
```

#### GET /api/products/[id]
Получение продукта по ID.

#### PUT /api/products/[id]
Обновление продукта.

#### DELETE /api/products/[id]
Удаление продукта.

### Categories API

#### GET /api/categories
Получение списка категорий.

**Query параметры:**
- `page` (number): Номер страницы
- `limit` (number): Количество элементов на странице
- `search` (string): Поиск по названию
- `active` (boolean): Только активные категории
- `includeProducts` (boolean): Включить продукты в ответ

#### POST /api/categories
Создание новой категории.

#### GET /api/categories/[id]
Получение категории по ID.

#### PUT /api/categories/[id]
Обновление категории.

#### DELETE /api/categories/[id]
Удаление категории (только если нет связанных продуктов).

### Materials API

#### GET /api/materials
Получение списка материалов.

#### POST /api/materials
Создание нового материала.

#### GET /api/materials/[id]
Получение материала по ID.

#### PUT /api/materials/[id]
Обновление материала.

#### DELETE /api/materials/[id]
Удаление материала (только если нет связанных продуктов).

### Scents API

#### GET /api/scents
Получение списка ароматов.

#### POST /api/scents
Создание нового аромата.

#### GET /api/scents/[id]
Получение аромата по ID.

#### PUT /api/scents/[id]
Обновление аромата.

#### DELETE /api/scents/[id]
Удаление аромата (только если нет связанных продуктов).

## Тестовые аккаунты

После выполнения `npm run db:seed` будут созданы следующие тестовые аккаунты:

- **Администратор**: admin@askim-candles.uz / admin123
- **Менеджер**: manager@askim-candles.uz / manager123
- **Пользователь**: user@example.com / user123

## Дополнительные команды

- `npm run db:studio` - Открыть Prisma Studio для просмотра данных
- `npm run db:reset` - Сброс базы данных
- `npm run db:push` - Применить изменения схемы к базе данных

## Структура базы данных

### Основные модели:

- **User** - Пользователи системы
- **Category** - Категории продуктов
- **Material** - Материалы изготовления
- **Scent** - Ароматы
- **Product** - Продукты
- **ProductTranslation** - Переводы продуктов
- **ProductImage** - Изображения продуктов
- **ProductAttribute** - Дополнительные атрибуты продуктов

### Поддержка многоязычности

Система поддерживает три языка:
- `uz` - Узбекский
- `ru` - Русский
- `en` - Английский

Переводы хранятся в таблице `ProductTranslation` и автоматически подключаются при запросах с указанием параметра `locale`.