# System Patterns: Askim candles

## 1. Architecture Overview

*   **Frontend:** Next.js application using the App Router with comprehensive TypeScript implementation.
*   **Component Model:** Primarily React Server Components by default for main site display, with Client Components (`"use client"`) for interactivity and browser-specific APIs. Admin panel uses more client components for its dynamic nature.
*   **Styling:** Tailwind CSS utility classes with a comprehensive theme system defined in `globals.css` for ShadCN UI components. Corporate color palette implemented across both light and dark themes.
*   **State Management:**
    *   Client-side state managed with React hooks (`useState`, `useEffect`, `useReducer`).
    *   Shared client-side state for Cart via `CartContext` with localStorage persistence.
    *   Session state for social logins (Google) managed by NextAuth.js (`useSession`, `SessionProvider`).
    *   Admin panel theme (Dark/Light) managed server-side in user profiles (AdminProfile/ManagerProfile) with API endpoints.
    *   Admin panel language (EN/RU) preference managed server-side in user profiles (AdminProfile/ManagerProfile) with API endpoints.
    *   Authentication state managed through NextAuth.js with database persistence via Prisma ORM.
*   **Data Fetching/Mutation (Current):**
    *   Database operations handled through Prisma ORM with PostgreSQL backend (24 models including User, Product, Category, Order, Client, Manager, Log, etc.).
    *   Product data includes extended attributes: SKU, costPrice, isActive, scent, material, dimensions, burningTime.
    *   Admin operations (products, managers, clients, logs, attributes, articles) use full CRUD operations with database persistence.
    *   Dynamic attributes (Categories, Materials, Scents) managed through admin interface with database storage.
    *   Real-time admin logging system with database persistence.
*   **Data Fetching/Mutation (Planned Backend - Prisma/PostgreSQL):**
    *   Server Actions or Next.js Route Handlers will be used for form submissions and data mutations, interacting with Prisma.
*   **Internationalization (i18n):**
    *   **Main Site:** Path-based localization (`/[locale]/...`) for UZ (default), RU, EN. Dictionaries are in `src/dictionaries/`. Main e-commerce flow pages and "Useful Info" section are fully localized.
    *   **Admin Panel:** Client-side language preference (EN default, RU). Dictionaries in `src/admin/dictionaries/`. Admin layout and key pages (Dashboard, Login, Attribute pages, Product pages, Sessions) are localized.
*   **Logging (Admin Panel - Database):**
    *   Real-time admin logging system with database persistence via Prisma ORM.
    *   Comprehensive activity tracking for login/logout, product operations, manager actions, attribute changes.
    *   Admin logs stored in database with proper indexing and querying capabilities.
*   **AI Integration (Planned/Genkit):**
    *   Genkit flows (`ai.defineFlow`) to wrap prompts (`ai.definePrompt`).
    *   Prompts to use Handlebars templating.

## 2. Key Technical Decisions & Patterns

*   **Next.js App Router:** Adopted for routing, layouts, and Server Component support with comprehensive file-based routing.
*   **ShadCN UI:** Chosen for pre-built, customizable UI components, integrated with Tailwind CSS and corporate theming.
*   **TypeScript:** Used for type safety and improved code maintainability across all components.
*   **Authentication System:**
    *   NextAuth.js integration with database persistence for session management.
    *   Role-based access control with ADMIN/MANAGER roles stored in database.
    *   Middleware protection for admin routes with strict navigation and page-level protection.
    *   Multi-provider support with Google Sign-In and credentials provider.
*   **Future Backend:** Intention to use Prisma as ORM with PostgreSQL database. Comprehensive `deployment_guide.md` outlines the transition.
*   **Atomic Design Principles:** Focus on creating small, reusable UI components composed into larger structures.
*   **Placeholder Content:** `https://placehold.co` for images, with `data-ai-hint` for context.
*   **Admin Panel Structure:**
    *   Located at `/admin` with comprehensive routing structure.
    *   Separate layout (`src/app/admin/layout.tsx`) with role-based navigation, protection, theme toggle, language switcher, and mobile access restriction.
    *   Collapsible sidebar with accordion organization for attribute management.
    *   Comprehensive CRUD operations for products (with SKU, costPrice, isActive, expanded attributes and image upload via `ImageUploadArea.tsx`), managers, clients, attributes, articles.
    *   Advanced features: filtering, sorting, pagination, modal interactions.
*   **Mobile Detection:** `useIsMobile` hook for client-side responsive logic with admin panel mobile restriction.
*   **Dynamic Filters (Main Site):** Scent, Material, and Price Range filters dynamically generated from **active** product data with robust string normalization.

## 3. Component Relationships (High-Level)

*   **Main Site:**
    *   Root `src/app/layout.tsx` redirects to default locale.
    *   `src/app/[locale]/layout.tsx` wraps all main site pages and includes `Providers` and handles dictionary loading for server components.
    *   `Providers` (`src/app/providers.tsx`) sets up client-side contexts (`SessionProvider`, `SimulatedAuthProvider`, `CartProvider`, `Toaster`).
    *   `Header` and `Footer` provide global navigation and information, adapted for i18n with corporate styling.
*   **Admin Panel:**
    *   `AdminLayout` (`src/app/admin/layout.tsx`) wraps all `/admin/*` pages. Includes `AdminAuthProvider`, theme management, client-side i18n handling, mobile access restriction, and version display.
    *   Admin layout contains a responsive header (sidebar toggle, mobile menu, theme/lang toggles) and a collapsible sidebar with role-based navigation.
    *   Admin pages (Dashboard, Products, Users, Clients, Sessions, Attributes, Articles, Logs, etc.) are rendered within this layout.
*   **Page components are built by composing various UI and domain-specific components with consistent patterns.**

## 4. Data Flow Patterns

*   **Main Site Product Flow:**
    *   Server Components fetch from `mock-data.ts` → Client Components receive as props → Context manages cart state → LocalStorage persists cart.
*   **Admin Panel Data Flow:**
    *   Authentication via NextAuth.js with role-based access control.
    *   Server-side language switching (EN/RU) with database persistence in user profiles.
    *   Server-side theme management (Dark/Light) with database persistence in user profiles.
    *   Database integration via Prisma ORM with user preferences stored in AdminProfile/ManagerProfile.
    *   Client Components fetch from database via API routes → NextAuth manages auth state → Forms submit to API endpoints → Database updates via Prisma → Real-time logging → UI reflects changes.
    *   Admin logging system simulated client-side, planned server-side implementation.
*   **Filter/Search Patterns:**
    *   URL params drive filter state → Dynamic calculation of available options → String normalization for robust matching → Real-time UI updates.

## 5. Error Handling

*   Next.js `error.js` files for route segment error boundaries (implemented as needed).
*   Client-side error notifications via `useToast` with enhanced UX for login/registration flows.
*   Comprehensive form validation using Zod schemas with user-friendly error messages.
*   Fallback UI patterns for missing data or failed operations.

## 6. Theme Management

*   **Admin Panel:** Dark/Light theme toggle via button in admin layout with corporate-derived color palette.
*   **Preference Storage:** Theme preference stored in `localStorage` with automatic application.
*   **CSS Variables:** The `dark` class applied to `<html>` element triggers Tailwind's dark mode variants.
*   **Corporate Integration:** Both themes use corporate color system with optimized hover effects and accessibility.

## 7. Security Patterns (Current Implementation)

*   **Role-Based Access:** Comprehensive ADMIN/MANAGER role system with navigation and page-level restrictions.
*   **Input Validation:** Zod schemas for all form inputs with sanitization.
*   **Client-Side Protection:** Simulated authentication with proper state management preparing for backend integration.
*   **Data Isolation:** Admin and main site authentication systems completely separate.

## 8. Performance

*   **Code Splitting:** Automatic route-based splitting with Next.js App Router and dynamic imports for heavy components.
*   **Image Optimization:** Next.js Image component with automatic WebP conversion and responsive sizing.
*   **Caching Strategy:** Static generation for product pages, dynamic rendering for user-specific content.
*   **Bundle Optimization:** Tree shaking, minification, and compression in production builds.
*   **Client-Side Optimization:** React.memo for expensive components, useMemo/useCallback for heavy computations.
*   **Database Optimization (Planned):** Prisma query optimization, indexing strategy, connection pooling.

## 9. Development Patterns

*   **File Organization:** Feature-based structure with clear separation of concerns.
*   **Component Patterns:** Consistent prop interfaces, error boundaries, loading states.
*   **Testing Strategy:** Unit tests for utilities, integration tests for API routes, E2E tests for critical flows.
*   **Code Quality:** ESLint, Prettier, TypeScript strict mode, pre-commit hooks.
*   **Documentation:** Inline comments, README files, API documentation.

## 10. Deployment & DevOps

*   **Environment Management:** Separate configs for development, staging, production.
*   **CI/CD Pipeline:** Automated testing, building, and deployment.
*   **Monitoring:** Error tracking, performance monitoring, user analytics.
*   **Backup Strategy:** Database backups, asset backups, disaster recovery.
*   **Scaling Considerations:** Horizontal scaling, CDN integration, database optimization.