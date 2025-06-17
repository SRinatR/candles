# Active Context: Askim candles

## Date: 2025-01-27 (Current Update)

## 1. Current Focus
*   **✅ Product Creation Form Fixed:** Successfully resolved image validation issues in admin product creation form.
    *   Fixed handleImagesChange function to properly extract preview URLs from image objects.
    *   Removed console.log spam that was cluttering the browser console.
    *   Form now correctly validates and accepts uploaded images.
*   **✅ Tailwind CSS 4.x Color System Fixed:** Successfully resolved color display issues with Tailwind CSS 4.x.
    *   CSS variables converted from HSL to hex format for proper Tailwind 4.x compatibility.
    *   All color themes (light/dark) now display correctly.
    *   SVG image loading issues resolved with dangerouslyAllowSVG configuration.
*   **✅ Build System Stabilized:** All deprecated route files removed, build process working correctly.

## 2. Recent Changes (Leading to this state)
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