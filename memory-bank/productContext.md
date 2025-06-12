
# Product Context: Askim candles

## 1. Why This Project Exists

Askim candles aims to provide an online platform for customers to discover and purchase unique, handcrafted scented products and home decor items. It caters to individuals seeking artisanal quality and a personalized shopping experience for items that enhance their living spaces and well-being. A key part of the project is also an administrative panel for store owners/managers to manage the shop's operations. The main focus of the business is on **corporate clients**.

## 2. Problems It Solves

*   Provides a dedicated marketplace for a niche set of products (candles, wax figures, gypsum items, corporate sets, wedding favors).
*   Offers a curated selection, potentially differentiating from larger, less specialized e-commerce sites.
*   Allows artisans or a small business to reach a wider customer base, with a special emphasis on B2B/corporate orders.
*   Simplifies the purchasing process for these specialized items.
*   Provides tools for store administrators/managers to manage products (including detailed attributes like SKU, cost price, active status, scent, material, dimensions, burning time, and images), orders, users, content, discounts, and other store aspects efficiently.

## 3. How It Should Work

### A. Customer-Facing Application (Localized: UZ default, RU, EN):

1.  **Discovery & Browsing:** Users land on the homepage, see featured **active** products, categories (including "Корпоративные наборы"). Navigate to product listings (showing only **active** products), use filters (category, dynamic price range from active products, dynamic scent from active products, dynamic material from active products) and sorting.
2.  **Product Details & Cart:** View individual product pages with images, detailed attributes (SKU, scent, material, dimensions, burningTime), add to cart. Prices in UZS. (Inactive products still accessible via direct URL).
3.  **Checkout & Account:** Streamlined checkout, (mock) payment. Registered users manage profile, (mock) addresses, (mock) order history. Forced login before checkout.
4.  **Authentication:** Hybrid - NextAuth (Google), client-simulated (email/password with multi-step registration & confirmation and password visibility).
5.  **Language Selection:** Users can switch site language using a functional switcher (desktop dropdown, compact mobile horizontal list).
6.  **"Полезное" (Useful Info) Section:** Header contains a link to an `/info` page listing articles. Articles are managed in admin panel (multilingual text & images).

### B. Admin Panel (`/admin` path - Localized: EN default, RU - Dark/Light Theme available):

1.  **Login:** Separate login for admin/manager roles (simulated email/password via `AdminAuthContext` with password visibility).
2.  **Dashboard:** View key statistics (UI stubs with mock values, "Recent Activity" from simulated logs).
3.  **Product Management:** Add, view, edit, delete products. Filter and search.
    *   Forms include fields for multilingual name & description, SKU, price, cost price, category (dynamic list), stock, scent (dynamic list), material (dynamic list), dimensions, burningTime, and an `isActive` toggle.
    *   Image management with drag-and-drop upload, previews, and main image selection (Data URL based).
    *   Product list displays main image, ID, SKU, cost price, and Active status with a toggle.
4.  **Order Management (Sales):** View orders, filter, update status. (UI stubs with more structure).
5.  **User Management (Management - Admin Only):**
    *   View registered site users (requires backend).
    *   Manage admin panel roles: UI for listing managers (predefined & dynamically "added" via localStorage) and form for "adding" new managers by Admin (client-side simulated, with password visibility).
    *   Block/unblock accounts (requires backend).
6.  **Client Management:** View list of mock clients, client-side search, simulated block/unblock. (UI implemented).
7.  **Attribute Management (Admin Only):** Full CRUD for Categories, Materials, Scents via `localStorage`. Warning modals for deleting/renaming in-use attributes.
8.  **Article Management (Admin Only):** CRUD for articles (multilingual text, shared or per-language images) via `localStorage`.
9.  **Discount Management:** Create/manage promo codes. (UI stubs exist).
10. **Content Management:** Edit homepage content, banners, info pages. (UI stubs exist).
11. **Store Settings (Admin Only):** Configure store parameters. (UI stubs exist).
12. **Logs (Admin Only):** View simulated admin action logs from `localStorage`. Allow clearing all logs. Client-side filtering and sorting implemented.
13. **Additional Sections:** Marketing, Reports, Finances (UI stubs with more structure).
14. **Language and Theme Selection:** Admins can switch language (EN/RU) and theme (Light/Dark).
15. **Mobile Access Restriction:** Panel (except login) is not usable on mobile; prompts to use desktop.
16. **Version Display:** Footer shows simulated app version and last update date.

## 4. User Experience Goals

*   **Main Site:** Elegant, calming, intuitive, visually appealing, trustworthy, responsive. Prices in UZS. Focus on attracting corporate clients through relevant categories and information.
*   **Admin Panel:** Modern, professional (Turo/MoscowDreamCars style), efficient, task-oriented, clear, readable, responsive, informative, customizable (theme/language). Dark theme uses corporate-derived palette.
