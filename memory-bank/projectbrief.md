
# Askim Candles - Project Brief

## Обзор проекта
Askim Candles - это многоязычная e-commerce платформа для продажи свечей ручной работы с полноценной административной панелью. Проект построен на современном стеке технологий с использованием Next.js 15, TypeScript, Tailwind CSS 4.x, Prisma ORM и PostgreSQL.

## Основные цели
- Создание современного интернет-магазина свечей с высокой производительностью
- Поддержка трех языков: узбекский (uz), русский (ru), английский (en)
- Административная панель для управления товарами, заказами, пользователями и контентом
- Интеграция с NextAuth для аутентификации
- Система управления базой данных через Prisma ORM
- SEO-оптимизация и адаптивный дизайн

## Целевая аудитория
- Покупатели свечей ручной работы
- Корпоративные клиенты для подарочных наборов
- Организаторы свадеб и мероприятий
- Любители ароматерапии и домашнего уюта

## Ключевые особенности
- Многоязычность с поддержкой i18n и динамической локализацией
- Адаптивный дизайн с Tailwind CSS 4.x и темной/светлой темой
- Полноценная система управления контентом через админ-панель
- NextAuth интеграция с Google OAuth и credentials провайдером
- PostgreSQL база данных с Prisma ORM (24 модели)
- Comprehensive API маршруты для всех операций CRUD
- Ролевая система (ADMIN, MANAGER, USER) с middleware защитой
- Система логирования действий администраторов в реальном времени
- Загрузка и управление изображениями с оптимизацией
- SEO оптимизация и производительность
- Готовность к production развертыванию

**My Role:** App Prototyper (Firebase Studio AI Coding Partner, "Cursor")

**My Goal:** Assist the user in building and modifying the Askim candles app by making code changes based on conversational requests. I operate with a "Memory Bank" system to maintain context and project knowledge across interactions, as my internal memory resets.

**App Description (from PRD & User Requests):** Askim candles is an e-commerce application for browsing and purchasing artisanal candles, wax figures, and gypsum products. It includes a customer-facing site and an administrative panel for store management.

## 2. Core App Features (from PRD & User Requests):

*   **Main Site (i18n: UZ (default), RU, EN):**
    *   Product Catalog with advanced filtering, sorting, and search capabilities powered by database.
    *   Shopping Cart & Checkout with session persistence and order processing.
    *   User Accounts with NextAuth (Google OAuth + credentials provider) and database user management.
    *   Multilingual content with database-driven translations for products and articles.
    *   Responsive design with mobile-optimized interface and language switching.
    *   SEO optimization with Next.js metadata and structured data.
*   **Admin Panel (`/admin` - i18n: EN (default), RU - Dark/Light Theme):**
    *   Role-based access (ADMIN, MANAGER) with NextAuth integration and database persistence.
    *   Dashboard with statistics and real-time activity logs from database.
    *   **Product Management:** Full CRUD operations with Prisma ORM. Forms include image upload, multilingual support, and comprehensive product attributes (scent, material, dimensions, burningTime).
    *   **User Management (Admin Only):** Real user management with role assignment, account status control, and database persistence.
    *   **Client Management:** Database-driven client management with search and account control.
    *   **Admin Logs:** Real-time admin activity logging with database storage and filtering capabilities.
    *   **Content Management:** Article and page management with multilingual support.
    *   **Attribute Management:** Dynamic category, material, and scent management.
    *   Orders, Discounts, Settings sections with database integration.
    *   Collapsible sidebar, theme/language toggles, mobile access restriction, version display.
*   Payment Processing: Planned integration with local payment providers.
*   **Current Backend:** Prisma ORM with PostgreSQL database fully implemented and operational.

## 3. Style Guidelines (from PRD):

*   **Main Site:** Soft, muted lavender primary; light desaturated beige background; pale gold accent. Minimalist, elegant sans-serif fonts.
*   **Admin Panel:** Modern (Turo/MoscowDreamCars style), minimalistic, high readability, responsive. Dark/light theme.

## 4. My Operational Guidelines:

*   **Memory Bank Protocol:** Adhere strictly. Read ALL Memory Bank files at the start of EVERY task. Update files after significant changes or when context needs clarification.
*   **Planner Mode:** For large tasks, ask 4-6 clarifying questions, draft a plan, seek approval, then implement step-by-step.
*   **Tech Stack:** NextJS (App Router), React, ShadCN UI, Tailwind, Genkit (AI - not yet implemented). Prisma/PostgreSQL planned for backend.
*   **Code Quality:** Follow NextJS best practices, focus on clean, readable, performant code. Avoid hydration errors.
*   **i18n:** Main site (UZ/RU/EN path-based). Admin panel (EN/RU client-side preference).
*   **Deployment:** A `deployment_guide.md` has been started to track steps for production.
