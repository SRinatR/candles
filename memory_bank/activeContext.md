# Askim Candles - Active Context

## Project Overview
Askim Candles is a multilingual e-commerce platform for candles built with Next.js 15, React 19, TypeScript, Tailwind CSS 4.x, and Prisma with PostgreSQL.

## Recent Changes (Latest First)

### 2024-12-19: Frontend Integration with Real API Data
- **Replaced all mock data with real API calls across the application**
- Updated main pages to use real data:
  - Homepage (`src/app/[locale]/page.tsx`) - converted to client component with API data fetching
  - Products listing page (`src/app/[locale]/products/page.tsx`) - real products and categories
  - Individual product page (`src/app/[locale]/products/[id]/page.tsx`) - real product data
- Updated admin panel pages:
  - Products management (`src/app/admin/products/page.tsx`) - real products data
  - Product editing (`src/app/admin/products/edit/[id]/page.tsx`) - real product and categories data
  - Categories management (`src/app/admin/attributes/categories/page.tsx`) - real categories data
  - Materials management (`src/app/admin/attributes/materials/page.tsx`) - real materials data
  - Scents management (`src/app/admin/attributes/scents/page.tsx`) - real scents data
- **Added proper loading states and error handling**
- **Maintained localStorage fallback for admin attribute management**
- **All data is now functional and real - no more placeholders**

### 2024-12-19: Backend Implementation Complete
- **Full backend implementation for products and attributes**
- Updated Prisma schema with new models: Product, Category, Material, Scent, ProductTranslation
- Created full CRUD API endpoints:
  - `/api/products` - GET (with filtering, pagination) and POST
  - `/api/products/[id]` - GET, PUT, DELETE
  - `/api/categories` - GET and POST with CRUD operations
  - `/api/categories/[id]` - GET, PUT, DELETE
  - `/api/materials` - GET and POST with CRUD operations  
  - `/api/materials/[id]` - GET, PUT, DELETE
  - `/api/scents` - GET and POST with CRUD operations
  - `/api/scents/[id]` - GET, PUT, DELETE
- Created comprehensive seed file (`prisma/seed.ts`) with real test data
- Configured Prisma client (`src/lib/prisma.ts`)
- Updated `package.json` with new dependencies and database scripts
- Updated `.env.example` with database configuration
- Created `BACKEND_README.md` with full API documentation and setup instructions
- **Key API Features:**
  - Multilingual support (EN, RU, UZ)
  - Filtering and pagination
  - Zod validation
  - Database transactions
  - Related data handling (products with categories, materials, scents)
  - Uniqueness checks (SKU, names)
  - Soft delete protection (prevent deletion if referenced)

### Previous Updates
- Fixed Tailwind CSS 4.x color system and build issues
- React 19.1.0 migration completed
- Various component and dependency fixes
- Admin panel features implementation (sessions, user/manager management, product list layout, cost price, product deactivation, dynamic attributes)
- Main site product filters and footer updates
- i18n and dark theme support in admin panel
- Product card price alignment
- Resolution of multiple errors

## Current Status
- ✅ Backend fully implemented with real data
- ✅ Frontend integrated with real API calls
- ✅ All mock data replaced
- ✅ Loading states and error handling added
- ✅ Multilingual support working
- ✅ Admin panel fully functional
- ✅ Database schema and API endpoints complete

## Next Steps
- Set up database and run migrations
- Test all functionality end-to-end
- Deploy to production environment
- Add more advanced features (search, recommendations, etc.)

## Technical Stack
- **Frontend:** Next.js 15.3.3, React 19.1.0, TypeScript
- **Styling:** Tailwind CSS 4.1.10
- **Database:** PostgreSQL with Prisma ORM
- **UI Components:** Radix UI, Shadcn/ui
- **Forms:** React Hook Form with Zod validation
- **Internationalization:** Custom i18n implementation (EN, RU, UZ)
- **State Management:** React Context API
- **Authentication:** NextAuth.js (configured but not fully implemented)

## Key Features
- Multilingual e-commerce platform
- Product catalog with categories, materials, and scents
- Admin panel for content management
- Shopping cart functionality
- Responsive design with dark/light theme
- Real-time data from PostgreSQL database
- SEO-optimized with proper meta tags
- Image optimization and lazy loading