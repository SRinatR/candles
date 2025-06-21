
# Product Context: Askim Candles

## 1. Project Overview

Askim Candles is a comprehensive e-commerce platform specializing in handcrafted scented candles and home decor items. The project consists of a customer-facing multilingual website and a sophisticated admin panel for business management. Built with Next.js 15, TypeScript, and modern web technologies, it emphasizes corporate clients while serving individual customers.

## 2. Business Objectives

- **Primary Market**: Corporate clients seeking custom candle sets and bulk orders
- **Secondary Market**: Individual customers looking for artisanal home decor
- **Geographic Focus**: Uzbekistan market with UZS pricing
- **Product Categories**: Candles, wax figures, gypsum items, corporate gift sets, wedding favors
- **Differentiation**: Curated artisanal products with personalized B2B services

## 3. Technical Implementation Status

### A. Database & Backend (PostgreSQL + Prisma)

**Implemented Models:**
- User management with roles (USER, ADMIN, MANAGER) and status tracking
- Product catalog with multilingual support (ProductTranslation)
- Category and Material hierarchies with translations
- Order management with status tracking and payment integration
- Review system with rating capabilities
- Admin logging and session management
- Article/content management system
- Image and tag management
- Manager and Admin profile systems

**API Endpoints:**
- `/api/products` - Product CRUD with filtering, pagination, search
- `/api/admin/users` - User management with role-based access
- `/api/categories` - Category management
- `/api/materials` - Material management
- `/api/articles` - Content management
- `/api/auth/[...nextauth]` - Authentication handling
- `/api/upload` - Image upload functionality

### B. Authentication System (NextAuth.js)

**Providers:**
- Google OAuth integration
- Credentials provider for email/password
- Role-based access control (USER, ADMIN, MANAGER)
- Session management with database persistence

**Security Features:**
- Protected admin routes with middleware
- Role verification for sensitive operations
- Secure session handling

### C. Customer-Facing Website

**Internationalization (i18n):**
- Supported locales: UZ (default), RU, EN
- Dynamic locale routing (`/[locale]`)
- Database-driven translations for products and content
- Locale-specific dictionaries

**Core Features:**
- Product browsing with advanced filtering
- Category-based navigation
- Shopping cart functionality
- User authentication and profiles
- Responsive design with Tailwind CSS
- SEO optimization with Next.js metadata

### D. Admin Panel (`/admin`)

**Dashboard:**
- Key metrics display (sales, users, orders)
- Recent activity logs
- Trend indicators and analytics

**Management Modules:**
- **Products**: Full CRUD with image management, multilingual support
- **Users**: Role management, account status control
- **Orders**: Status tracking, order processing
- **Categories/Materials**: Attribute management
- **Articles**: Content management for "Полезное" section
- **Settings**: Store configuration
- **Reports**: Sales and analytics (planned)

**Admin Features:**
- Role-based access (Admin vs Manager permissions)
- Activity logging system
- Dark/Light theme support
- Mobile-responsive design
- Bulk operations support

## 4. Current Development Status

### Completed Modules:
- ✅ Database schema and Prisma setup
- ✅ NextAuth authentication system
- ✅ Basic API routes structure
- ✅ Admin panel layout and navigation
- ✅ User management system
- ✅ Product management foundation
- ✅ Internationalization framework
- ✅ Core UI components (Shadcn/ui)

### In Development:
- 🔄 Product catalog frontend
- 🔄 Shopping cart implementation
- 🔄 Order processing system
- 🔄 Payment integration
- 🔄 Image upload and management

### Planned Features:
- 📋 Advanced reporting and analytics
- 📋 Email notification system
- 📋 Inventory management
- 📋 Discount and promotion system
- 📋 Customer review system
- 📋 SEO optimization
- 📋 Performance monitoring

## 5. User Experience Goals

### Customer Site:
- **Design**: Elegant, calming aesthetic reflecting artisanal quality
- **Performance**: Fast loading, optimized images, smooth navigation
- **Accessibility**: WCAG compliant, keyboard navigation, screen reader support
- **Mobile**: Fully responsive, touch-friendly interface
- **Trust**: Secure checkout, clear pricing (UZS), transparent policies

### Admin Panel:
- **Efficiency**: Streamlined workflows, bulk operations, keyboard shortcuts
- **Clarity**: Clear data presentation, intuitive navigation, consistent UI
- **Customization**: Theme selection, language preferences, dashboard configuration
- **Reliability**: Error handling, data validation, backup systems
- **Scalability**: Support for growing product catalogs and user bases

## 6. Key Performance Indicators (KPIs)

### Business Metrics:
- Monthly recurring revenue (MRR)
- Average order value (AOV)
- Customer acquisition cost (CAC)
- Corporate client retention rate
- Conversion rate by traffic source

### Technical Metrics:
- Page load times (<3s)
- API response times (<500ms)
- Database query performance
- Error rates and uptime (99.9%)
- Mobile performance scores

### User Experience Metrics:
- User session duration
- Cart abandonment rate
- Admin task completion time
- Customer satisfaction scores
- Return customer percentage
