# Tech Context: Askim candles

## 1. Core Technologies

*   **Framework:** Next.js (App Router, currently v15+ target)
*   **Language:** TypeScript
*   **UI Library:** React
*   **Component Library:** ShadCN UI
*   **Styling:** Tailwind CSS
    *   Theme colors defined in `src/app/globals.css` using HSL CSS variables.
    *   **Light Theme (Main Site & Admin):** Corporate color palette: Pink (#F37E92), Light Pink (#FFD2DA), Dark Navy/Blue (#162044), Light Blue (#B2C9ED).
    *   **Dark Theme (Admin Panel):** Corporate-derived dark palette (Dark Navy/Blue background, corporate pinks/blues as accents/foregrounds with optimized hover effects).
*   **Frontend User Authentication (Main Site - Hybrid):**
    *   NextAuth.js (for social logins like Google).
    *   Client-side simulated email/password system using `AuthContext` and `localStorage` (with multi-step registration and password visibility toggles).
*   **Admin Panel Authentication:**
    *   Client-side simulated email/password system using `AdminAuthContext` and `localStorage` for `/admin` access (roles: ADMIN, MANAGER, with password visibility toggle). Dynamically added managers also stored in `localStorage`.
*   **Planned Backend (Future Integration):**
    *   **Database:** PostgreSQL
    *   **ORM:** Prisma
*   **AI Integration (Planned):** Genkit
*   **Internationalization (i18n):**
    *   **Main Site:** Path-based (`/[locale]/...`) with UZ (default), RU, EN. Uses dictionary files in `src/dictionaries/`. Main e-commerce flow pages and "Useful Info" section (with dynamic articles) are fully localized.
    *   **Admin Panel:** Client-side preference (EN default, RU) using `localStorage`. Uses dictionary files in `src/admin/dictionaries/`. Admin layout and key pages (Dashboard, Login, Attribute pages, Product pages, Sessions) are localized.
*   **Form Handling:** `react-hook-form` and `Zod` for validation.

## 2. Development Setup

*   The project is managed within Firebase Studio/Claude environment.
*   Code changes are applied via structured editing and artifacts system.
*   `package.json` lists all dependencies. `npm install` is handled automatically when `package.json` is updated.
*   Key scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `genkit:dev`, `genkit:watch`.
*   The user has a VPS and will require instructions for deployment (comprehensive guide in `memory-bank/deployment_guide.md`).

## 3. Technical Constraints & Guidelines

*   **Next.js App Router:** Preferred for routing and layouts.
*   **Server Components:** Default choice to reduce client-side JS for main site. Admin panel uses more client components for interactivity.
*   **TypeScript:** Strictly typed code, use `import type` for type imports.
*   **Reusable Components:** Create isolated components with default props.
*   **Server Actions / Route Handlers:** Preferred for form submissions and data mutations when backend is integrated with Prisma. Currently, admin forms use client-side simulation.
*   **Error Handling:** Use `error.js` boundary files, client-side toasts (enhanced for login/registration).
*   **Image Optimization:** Use `next/image` and `https://placehold.co` for placeholders with `data-ai-hint`.
*   **Code Quality:** Clean, readable, performant, well-organized. Functional components and hooks. No non-textual code generation. No comments in `package.json`.
*   **Hydration Errors:** Avoid by deferring browser-specific operations to `useEffect` or ensuring server/client render consistency.
*   **Genkit:** Adhere to v1.x API (when implemented).
*   **ShadCN UI:** Prefer ShadCN components. Theme is in `src/app/globals.css`.
*   **Icons:** Use `lucide-react`. Do not hallucinate icons.
*   **Admin Panel Theme:** Supports Dark/Light mode toggle, managed client-side.
*   **Product Attributes (Admin):** Forms for products include fields for SKU, isActive, costPrice, scent, material, dimensions, burningTime. Image uploads use `ImageUploadArea.tsx` for drag-and-drop and main image selection (Data URL based).
*   **Admin Panel Mobile Access:** Restricted (except login page).
*   **Admin Panel Version Display:** Implemented in admin layout footer.

## 4. Key Project Files (Structure Overview)

*   **Main Site Routes (`src/app/[locale]/`):**
    *   `layout.tsx`, `page.tsx` (homepage)
    *   `products/` - Product listing and detail pages
    *   `cart/`, `checkout/` - Shopping flow
    *   `account/`, `login/`, `register/` - User management
    *   `about/`, `info/` - Static and dynamic content pages
*   **Admin Panel Routes (`src/app/admin/`):**
    *   `login/page.tsx` - Admin authentication
    *   `layout.tsx` - Admin panel layout with sidebar/header
    *   `dashboard/page.tsx` - Admin dashboard
    *   `products/` - Product management (list, new, edit)
    *   `users/` - Manager management
    *   `clients/page.tsx` - Client management
    *   `sessions/page.tsx` - Session management
    *   `attributes/` - Categories, materials, scents management
    *   `articles/` - Content management
    *   `logs/page.tsx` - Activity logging
    *   `sales/`, `marketing/`, `reports/`, `finances/` - Additional admin sections
*   **Core Application Files:**
    *   `src/app/globals.css` - Global styles and ShadCN theme
    *   `src/app/providers.tsx` - Client-side context providers for main site
*   **Components (`src/components/`):**
    *   Reusable React components
    *   `admin/ImageUploadArea.tsx` - Drag-and-drop image upload component
*   **Data & Logic (`src/`):**
    *   `contexts/` - AuthContext (main site), AdminAuthContext (admin), CartContext
    *   `lib/` - Utility functions, mock data, type definitions, i18n config, NextAuth options
    *   `dictionaries/` - JSON translation files for main site
    *   `admin/dictionaries/` - JSON translation files for admin panel
    *   `admin/lib/` - Admin-specific i18n config and dictionary getter, admin logger
    *   `hooks/use-mobile.tsx` - Hook for mobile detection
*   **Memory Bank (`memory-bank/`):**
    *   Contextual documents including `deployment_guide.md`
*   **Planned (Backend Integration):**
    *   `prisma/schema.prisma` - Database schema definition (basic structure outlined in deployment guide)
    *   API routes in `src/app/api/` or Server Actions for backend interactions with Prisma

## 5. Data Management (Current Implementation)

*   **Main Site:** Uses `mock-data.ts` for products, categories. User authentication simulated via `localStorage`.
*   **Admin Panel:** All operations (products, managers, clients, logs, attributes, articles) simulated via `localStorage` with session persistence.
*   **Product Data:** Extended with multilingual content, SKU, costPrice, isActive, scent, material, dimensions, burningTime.
*   **Dynamic Attributes:** Categories, Materials, Scents managed through admin panel and stored in localStorage.
*   **Image Handling:** Currently Data URL based through `ImageUploadArea.tsx` component.
*   **Logging:** Simulated admin activity logging via `src/admin/lib/admin-logger.ts` stored in localStorage.

## 6. Performance & Optimization

*   **Server Components:** Maximized for main site to reduce client-side JavaScript.
*   **Image Optimization:** `next/image` used throughout with placeholder system.
*   **State Management:** Context used judiciously, localStorage for persistence.
*   **Dynamic Imports:** Used for admin panel components when beneficial.
*   **CSS:** Tailwind utility classes with corporate color system.

## 7. Security Considerations (Current)

*   **Client-Side Simulation:** Current authentication is simulated for development purposes.
*   **Input Validation:** Zod schemas used for form validation.
*   **Role-Based Access:** Implemented for admin panel navigation and page access.
*   **Password Handling:** Visibility toggles implemented, preparing for secure backend integration.

## 8. Future Integration Points

*   **Database:** PostgreSQL with Prisma ORM for all data operations.
*   **File Storage:** Real file upload system to replace Data URL approach.
*   **Authentication:** NextAuth Credentials provider integration with database.
*   **Email Services:** For user registration confirmations and notifications.
*   **Payment Processing:** Stripe integration for e-commerce transactions.
*   **AI Features:** Genkit integration for enhanced user experience.