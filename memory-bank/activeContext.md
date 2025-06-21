# Active Context: Askim candles

## Date: 2025-01-27 (Current Update)

## 1. Current Focus
*   **✅ Next-intl Migration Completed (2025-01-27):** Successfully migrated entire project from custom i18n system to professional next-intl library.
    *   **✅ Installed next-intl:** Added next-intl package for professional internationalization.
    *   **✅ Created i18n configuration:** Set up i18n.ts with supported locales (uz, ru, en) and message loading.
    *   **✅ Created request configuration:** Added i18n/request.ts for next-intl server-side configuration.
    *   **✅ Updated Next.js config:** Integrated createNextIntlPlugin into next.config.ts.
    *   **✅ Updated middleware:** Replaced custom locale detection with next-intl createMiddleware.
    *   **✅ Migrated dictionaries:** Moved all translation files from src/dictionaries to messages/ directory.
    *   **✅ Updated layout:** Converted src/app/[locale]/layout.tsx to use NextIntlClientProvider and getMessages.
    *   **✅ Updated Header component:** Replaced dictionary props with useTranslations hook.
    *   **✅ Updated Footer component:** Converted to use useTranslations instead of dictionary props.
    *   **✅ Updated HomePage:** Migrated from getDictionary to useTranslations hook.
    *   **✅ Build successful:** Project builds without errors with exit code 0.
    *   **✅ Dev server running:** Application runs successfully on http://localhost:9002.
    *   All components now use modern next-intl hooks instead of custom dictionary system.
*   **✅ User Stats API Error Fixed (2025-01-27):** Resolved PrismaClientValidationError for non-existent `isBlocked` field in User model.
    *   **✅ Added missing field to schema:** Added `isBlocked Boolean @default(false)` field to User model in prisma/schema.prisma.
    *   **✅ Database Migration:** Applied migration `20250621083125_add_is_blocked_field` to add isBlocked column to users table.
    *   **✅ Restored API functionality:** Updated `/api/admin/users/stats/route.ts` to use isBlocked field in problemUsers query.
    *   **✅ Full functionality preserved:** All user statistics features now work without removing any functionality.
    *   User statistics API now works correctly with complete problem user detection including isBlocked field.
*   **✅ Category Status Toggle Error Fixed (2025-01-27):** Resolved "Failed to update category status" console error in toggleCategoryStatus function.
    *   **✅ Fixed Prisma Schema:** Added missing `isActive`, `description`, and `image` fields to Category model in schema.prisma.
    *   **✅ Database Migration:** Applied migration to create missing database columns for category management.
    *   **✅ Database Seeding:** Fixed seed.ts imports and successfully populated database with initial data.
    *   **✅ API Functionality:** PUT requests to `/api/categories/[id]` now properly handle isActive field updates.
    *   Category status toggle functionality in admin panel now works without console errors.
*   **✅ AdminLog Metadata Field Error Fixed (2025-01-27):** Resolved PrismaClientValidationError for non-existent metadata field in AdminLog model.
    *   **✅ Fixed AdminLog queries:** Removed references to non-existent `metadata` and `updatedAt` fields from all Prisma select statements.
    *   **✅ Updated metadata storage:** Modified all AdminLog creation to store metadata as JSON string within the `details` field.
    *   **✅ Fixed admin-logger.ts:** Updated logAdminAction function to properly handle metadata storage in details field.
    *   **✅ Fixed logs stats API:** Updated actionTypeStats processing to parse metadata from details JSON field.
    *   **✅ Fixed logs export API:** Updated both CSV and JSON export functionality to properly extract metadata from details field.
    *   **✅ Updated LogFilters interface:** Added format and includeMetadata parameters for export functionality.
    *   Admin logs functionality now works without PrismaClientValidationError and properly handles metadata.
*   **✅ getUserStats API Error Fixed (2025-01-27):** Resolved "Не удалось загрузить статистику" console error in admin panel.
    *   **✅ Fixed missing imports:** Added missing NextRequest and NextResponse imports to `/api/admin/users/stats/route.ts`.
    *   **✅ API endpoint now functional:** getUserStats function can now successfully fetch user statistics without console errors.
    *   Admin dashboard statistics now load properly without "Не удалось загрузить статистику" error.
*   **✅ Console Error Fixed (2025-01-27):** Resolved "Не удалось загрузить пользователей" error in admin users page.
    *   **✅ Fixed missing imports:** Added missing NextRequest and NextResponse imports to `/api/admin/users/route.ts`.
    *   **✅ Fixed Prisma schema mismatch:** Removed reference to non-existent `isBlocked` field in user query.
    *   **✅ Fixed TypeError:** Invalid URL error in logAdminAction function.
    *   **✅ Resolved PrismaClientKnownRequestError:** Corrected table name from "User" to "users" in raw SQL queries.
    *   **✅ Updated logAdminAction calls:** All calls now use correct LogEntry object format instead of individual parameters.
    *   **✅ Temporarily disabled:** Non-existent /api/admin/logs endpoint calls.
    *   **✅ API endpoint now functional:** All admin users API endpoints now function without console errors.
    *   Admin users page can now successfully load user data without console errors.
*   **✅ NextAuth SessionProvider Error Fixed (2025-01-27):** Resolved "useSession must be wrapped in SessionProvider" runtime error.
    *   **✅ Fixed NEXTAUTH_URL configuration:** Updated from localhost:3000 to localhost:9002 to match dev server port.
    *   **✅ Fixed PORT configuration:** Updated environment variable from 3000 to 9002.
    *   **✅ Fixed SessionProvider configuration:** Ensured admin layout properly uses Providers component with SessionProvider.
    *   **✅ Resolved runtime error:** Admin panel now correctly accesses NextAuth session without SessionProvider wrapper errors.
    *   **✅ Server restarted:** Applied all SessionProvider fixes by restarting development server.
    *   NextAuth session and authentication now work correctly in admin panel.
*   **✅ Admin Logs Access Fixed (2025-01-27):** Resolved "Access Denied" issue on admin logs page.
    *   **✅ Fixed authentication check:** Updated logs page to use correct properties from useUnifiedAuth hook.
    *   **✅ Fixed variable references:** Changed `user` to `currentUser` and `loading` to `authLoading`.
    *   **✅ Fixed role checking:** Now properly uses `isAdmin` and `isManager` boolean flags.
    *   **✅ Fixed button functionality:** Updated clear logs button to use correct loading state and handler.
*   **✅ React Translation Object Rendering Error Fixed (2025-01-27):** Resolved "Objects are not valid as a React child" error in admin product edit page.
    *   **✅ Fixed SelectItem rendering:** Updated scent and material name extraction logic in `/src/app/admin/products/edit/[id]/page.tsx`.
    *   **✅ Enhanced type checking:** Added proper string type validation to prevent translation objects from being rendered directly.
    *   **✅ Improved fallback logic:** Ensured fallback values are always strings, not objects with {en, ru, uz} keys.
    *   **✅ Server restarted:** Applied fixes and verified functionality with new development server on port 9002.
    Admin product edit page now renders scent and material dropdowns without React child validation errors.
    *   Admin logs page now accessible for ADMIN and MANAGER roles.
*   **✅ Runtime Error Fixed:** Resolved critical React rendering error on admin/products page.
    *   **✅ Fixed object rendering issue:** Product name object {en, ru, uz} was being passed directly to React child.
    *   **✅ Updated handleDeleteProduct function:** Changed signature to accept string instead of Product['name'] object.
    *   **✅ Fixed function call:** Now passing product.name[adminLocale] || product.name.en instead of entire object.
    *   **✅ Fixed category rendering issue:** Added proper type checking for product.category object rendering in JSX (lines 373 and 396).
    *   Admin products page now loads without runtime errors.
*   **✅ TypeScript Errors Resolution Completed:** Fixed all remaining TypeScript compilation errors in admin panel and user profile.
    *   Added missing dictionary properties to English admin materials dictionary.
    *   Fixed Zod schema type assignment error in products edit page.
    *   **✅ Fixed user profile form TypeScript errors:** Resolved newsletter field type mismatch and SubmitHandler typing issues.
    *   Verified successful build completion with no TypeScript errors.
    *   All admin panel and user profile functionality now properly typed and functional.
*   **✅ Полное изучение проекта завершено:** Проведен комплексный анализ всей архитектуры Askim Candles.
    *   Изучена полная структура проекта и все компоненты Memory Bank системы.
    *   Проанализированы технические решения и текущее состояние кодовой базы.
    *   Подтверждена работоспособность dev сервера на порту 9002.
    *   Выявлены ключевые особенности архитектуры и готовность к production.
*   **✅ Memory Bank полностью актуализирован (2025-01-27):** Обновлена вся документация проекта.
    *   **✅ productContext.md:** Полностью переписан с актуальной информацией о техническом состоянии, реализованных функциях, статусе разработки и KPI.
    *   **✅ codebaseStructure.md:** Создан новый файл с детальной структурой проекта, описанием директорий, компонентов и архитектурных решений.
    *   **✅ devNotes.md:** Создан новый файл с заметками разработчика, техническими решениями, планами развития и известными проблемами.
    *   **✅ techContext.md:** Обновлен с актуальными версиями технологий и архитектурными паттернами.
    *   **✅ systemPatterns.md:** Расширен с подробным описанием паттернов разработки, производительности и развертывания.
    *   **✅ projectbrief.md:** Актуализирован с текущими целями и техническим стеком проекта.
    *   Все файлы Memory Bank теперь отражают реальное состояние проекта на январь 2025.
*   **✅ Документация и конфигурация обновлены:**
    *   Создан комплексный .gitignore файл для исключения ненужных файлов из репозитория.
    *   Полностью переписан README.md с подробным описанием проекта, архитектуры и инструкций.
    *   Добавлены разделы по быстрому старту, развертыванию, API endpoints и Memory Bank системе.
    *   Проверен существующий .env.example файл с необходимыми переменными окружения.
*   **✅ Структура проекта очищена (2025-01-27):**
    *   Удалена дублирующая папка memory_bank с устаревшим содержимым.
    *   Оставлена основная папка memory-bank с полной актуальной документацией.
    *   Устранено дублирование файлов activeContext.md.
*   **✅ Техническое состояние проекта:** 
    *   React 19.1.0 + Next.js 15.3.3 с Turbopack успешно работают.
    *   Tailwind CSS 4.x полностью интегрирован и функционален.
    *   Prisma + PostgreSQL схема готова к развертыванию.
    *   Все основные компоненты и API роуты реализованы.
    *   All TypeScript compilation errors resolved - clean build achieved.

## 2. Recent Changes (Leading to this state)

### Admin Preferences Migration (January 27, 2025)
*   **✅ MIGRATED**: Admin panel preferences from client-side to server-side
    *   **✅ Added**: Theme and language fields to AdminProfile and ManagerProfile models
    *   **✅ Created**: `/api/admin/preferences` API endpoints for GET/PUT operations
    *   **✅ Implemented**: `useAdminPreferences` hook for server-side preference management
    *   **✅ Updated**: AdminLayout to use server-side preferences instead of localStorage
    *   **✅ Updated**: systemPatterns.md to reflect server-side preference management

### Memory Bank Corrections (January 27, 2025)
*   **✅ CORRECTED**: `systemPatterns.md` - removed references to non-existent AuthContext and AdminAuthContext
*   **✅ CORRECTED**: `systemPatterns.md` - updated authentication flow to reflect NextAuth integration
*   **✅ CORRECTED**: `systemPatterns.md` - updated data flow patterns to reflect database operations
*   **✅ CORRECTED**: `codebaseStructure.md` - removed references to non-existent cart/ and forms/ directories
*   **✅ CORRECTED**: `codebaseStructure.md` - updated contexts section to reflect actual CartContext only
*   **✅ CORRECTED**: `codebaseStructure.md` - updated hooks section with actual hook files
*   **✅ CORRECTED**: `devNotes.md` and `projectbrief.md` - corrected Prisma model count from "25+" to "24"

### Technical Fixes
*   **✅ React 19.1.0 migration complete**
*   **✅ Tailwind CSS 4.x compatibility FULLY FIXED (2025-01-27)**
    *   **✅ PostCSS configuration updated:** Fixed postcss.config.mjs for Tailwind 4.x syntax
    *   **✅ Tailwind config restructured:** Proper TypeScript typing and export structure
    *   **✅ CSS layer issues resolved:** Fixed @apply border issue in globals.css
    *   **✅ Color system fixed:** Converted CSS variables from HSL to hex format for Tailwind 4.x
    *   **✅ SVG images fixed:** Added dangerouslyAllowSVG to Next.js config
    *   **✅ Deprecated routes removed:** Cleaned up old route files causing build errors
    *   **✅ Dev server working:** All colors and styles now properly applied
*   **✅ All Checkbox components fixed**
*   **✅ Docker warnings resolved**
*   **✅ Next.js deprecated warnings fixed**
*   **✅ @tailwindcss/postcss dependency added**
*   **✅ @next/swc-loader error resolved**
*   **✅ Next.js Turbopack configuration optimized**
*   **✅ Webpack configuration disabled for Turbopack compatibility**
*   **✅ Создание документации и конфигурации (Завершено)**
    *   **Обновлен .gitignore**: Добавлены комплексные исключения для зависимостей, тестов, сборки, переменных окружения, файлов базы данных (включая Prisma), загруженных медиа (с исключениями для конкретных SVG свечей), логов, данных времени выполнения, отчетов покрытия, временных файлов, файлов редактора/ОС, Docker, Vercel, Firebase, артефактов AI/ML, файлов резервных копий/архивов, файлов локальной разработки (включая `memory_bank/`), и файлов IDE
    *   **Создан новый README.md**: Подробная документация включает разделы по быстрому старту, развертыванию, API endpoints, и системе Memory Bank
    *   **Проверен .env.example**: Подтверждены примеры конфигураций для подключений к базе данных, NextAuth, Google OAuth, настроек приложения, и дополнительных сервисов
    *   **Обновлен activeContext.md**: Отражены изменения в документации и конфигурации
*   **✅ Оптимизация для Claude AI (Завершено)**
    *   **Модифицирован .gitignore**: Закомментированы исключения для `.modified`, `.trae/`, `memory_bank/`, файлов Prisma (схема, seed, миграции), и `.env.example` для сохранения в репозитории
    *   **Создан CLAUDE_DEBUG.md**: Комплексное руководство для Claude AI с инструкциями по работе с проектом, включая Memory Bank систему, архитектуру, правила разработки, известные проблемы, команды, стандарты кодирования, и чек-лист перед коммитом
*   **Admin Panel - Sessions Management:** New `/admin/sessions` page implemented with current session display and logout functionality.
*   **Admin Panel - Manage Users & Managers Enhancements:**
    *   Added simulated "View Client Details", "Edit Client", and "Delete Client" functionalities with modals to `/admin/clients` page.
    *   Refined Block/Unblock UI for managers in `/admin/users`.
    *   Implemented modal for (simulated) "Change Role" for managers.
    *   Added a more informative placeholder modal for "Permissions".
    *   Visual distinction for predefined vs. dynamically added users.
*   **Product Filters (Main Site):**
    *   Improved robustness of dynamic price range calculation.
    *   Enhanced string normalization for category, scent, and material matching to fix "No products found" issue.
    *   Ensured filters initialize correctly from URL params.
*   **Admin Product List Table Layout:** Addressed horizontal scrolling issues by adjusting column widths and padding.
*   **Cost Price Feature:** `costPrice` field added to products. Visible and editable in admin product forms and displayed in the admin product list.
*   **Product Deactivation Feature & SKU/ID:** Fully implemented. Products can be marked inactive, hiding them from main site listings. SKU and Product ID are now part of product data and admin UI.
*   **Admin Panel - Dynamic Attributes Management (Categories, Materials, Scents):** Implemented full CRUD (add, edit, delete from `localStorage`, with initial seeding from mock data) with warning modals for deleting/renaming in-use attributes. Product forms updated to use these dynamic attributes in `Select` components. Attribute menu in sidebar now an accordion.
*   **Main Site Footer Version Display:** "Last Updated" date removed from main site footer, only version remains.
*   **Admin Panel i18n & Dark Theme:**
    *   Admin panel supports EN/RU client-side language switching with expanded coverage.
    *   Dark/Light theme toggle implemented. Dark theme reverted to corporate-derived palette, hover effects adjusted.
*   **Main Site Product Card Price Alignment:** Prices on product cards are now consistently aligned.
*   **Error Fixes:** Multiple JSON parsing errors, "FormProvider not defined", "formState not defined", "SheetTrigger not defined", `cn` not defined, `currentPathWithoutLocale` not defined, and HTML nesting errors resolved.

## 3. Next Steps (Immediate Priorities)

**High Priority UX Improvements:**
*   Add a visual indicator for inactive products on the Product Detail page (`/[locale]/products/[id]`).
*   Improve the empty cart page (e.g., more engaging message, popular product suggestions).

**Admin Panel Enhancements:**
*   Implement basic order list UI for `/admin/sales` (using `mockOrders`).
*   Add basic data visualization to Dashboard (simple charts for sales, top products using `shadcn/ui` charts with mock data).
*   Implement pagination for admin lists (products, logs - client-side initially).

**Technical Improvements:**
*   Complete translation of remaining admin panel pages/components into EN/RU.
*   Prepare for backend integration by finalizing Prisma schema planning.

## 4. Active Decisions & Considerations
*   **Build Status:** ✅ Configuration fixed, dependencies updated, ready for build testing
*   **Admin Panel Access:** `/admin` path with client-side simulated authentication (`AdminAuthContext`) supporting 'ADMIN' and 'MANAGER' roles.
*   **Data Management (Admin):** Currently client-side simulated for all operations (products, managers, clients, logs, attributes, articles). All data persisted in `localStorage` except `mock-data.ts` changes which are session-only.
*   **Admin Panel i18n & Theme:** Full EN/RU localization with client-side preference storage. Dark/Light theme toggle with corporate-derived palette.
*   **Brand Identity:** "Askim candles" with corporate color palette applied throughout.
*   **Main Site i18n:** Path-based localization (UZ/RU/EN) with key e-commerce flows fully localized.
*   **Backend Strategy:** Prisma/PostgreSQL integration planned as next major phase, documented in `deployment_guide.md`.
*   **Development Approach:** MVP-first with iterative feature building, prioritizing UI/UX polish before backend integration.
*   **Product Management Philosophy:** Inactive products hidden from listings but accessible via direct URL for flexibility.
*   **Cost Transparency:** `costPrice` field added for internal admin use, separate from customer-facing price.
*   **Dynamic Content:** Categories, Materials, Scents managed dynamically through admin panel with localStorage persistence.
*   **Session Management:** Current implementation is device-based simulation, preparing ground for real multi-device session management with backend.