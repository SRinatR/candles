# Codebase Structure: Askim Candles

## Project Overview

Askim Candles is a Next.js 15 e-commerce application with TypeScript, featuring a customer-facing multilingual website and an admin panel. The project uses modern web technologies including Tailwind CSS 4.x, Prisma ORM with PostgreSQL, and NextAuth.js for authentication.

## Root Directory Structure

```
candles/
├── .env.local                 # Environment variables
├── .gitignore                 # Git ignore rules
├── components.json            # Shadcn/ui configuration
├── next.config.js            # Next.js configuration
├── package.json              # Dependencies and scripts
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
├── memory-bank/              # Project documentation
├── prisma/                   # Database schema and migrations
└── src/                      # Source code
```

## Source Code Structure (`src/`)

### Application Routes (`src/app/`)

```
src/app/
├── [locale]/                 # Internationalized customer routes
│   ├── layout.tsx            # Root layout with i18n
│   ├── page.tsx              # Homepage
│   ├── products/             # Product pages
│   ├── categories/           # Category pages
│   ├── cart/                 # Shopping cart
│   └── profile/              # User profile
├── admin/                    # Admin panel routes
│   ├── layout.tsx            # Admin layout
│   ├── dashboard/            # Admin dashboard
│   ├── products/             # Product management
│   ├── users/                # User management
│   ├── orders/               # Order management
│   ├── categories/           # Category management
│   ├── articles/             # Article management
│   ├── settings/             # Store settings
│   └── login/                # Admin login
├── api/                      # API routes
│   ├── auth/[...nextauth]/   # NextAuth configuration
│   ├── products/             # Product API
│   ├── admin/                # Admin API endpoints
│   ├── categories/           # Category API
│   ├── materials/            # Material API
│   ├── articles/             # Article API
│   └── upload/               # File upload API
├── globals.css               # Global styles
└── favicon.ico               # Site favicon
```

### Components (`src/components/`)

```
src/components/
├── admin/                    # Admin-specific components
│   ├── AdminTableSkeleton.tsx
│   ├── ImageUploadArea.tsx
│   └── UserManagement.tsx
├── ui/                       # Shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   ├── table.tsx
│   └── [other-ui-components]
├── layout/                   # Layout components
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── Navigation.tsx
└── products/                 # Product-related components
```

### Core Libraries (`src/lib/`)

```
src/lib/
├── types.ts                  # TypeScript type definitions
├── mock-data.ts              # Mock data for development
├── authOptions.ts            # NextAuth configuration
├── prisma.ts                 # Prisma client setup
├── utils.ts                  # Utility functions
├── validations.ts            # Zod validation schemas
└── constants.ts              # Application constants
```

### Contexts (`src/contexts/`)

```
src/contexts/
└── CartContext.tsx           # Shopping cart context
```

### Hooks (`src/hooks/`)

```
src/hooks/
├── use-mobile.tsx            # Mobile detection hook
├── use-toast.ts              # Toast notification hook
└── useUnifiedAuth.ts         # Unified authentication hook
```

### Internationalization (`src/dictionaries/`)

```
src/dictionaries/
├── en.json                   # English translations
├── ru.json                   # Russian translations
├── uz.json                   # Uzbek translations
└── admin/                    # Admin panel translations
    ├── en.json
    └── ru.json
```

## Database Schema (`prisma/`)

```
prisma/
├── schema.prisma             # Main database schema
├── migrations/               # Database migrations
└── seed.ts                   # Database seeding script
```

### Key Database Models

- **User**: User accounts with roles (USER, ADMIN, MANAGER)
- **Product**: Product catalog with multilingual support
- **Category**: Product categories with translations
- **Material**: Product materials with translations
- **Order**: Order management with status tracking
- **CartItem**: Shopping cart items
- **Review**: Product reviews and ratings
- **Article**: Content management for blog/info pages
- **Log**: Admin activity logging
- **Image**: File management system

## Configuration Files

### Next.js Configuration (`next.config.js`)
- Internationalization setup
- Image optimization
- API route configuration
- Build optimization

### Tailwind Configuration (`tailwind.config.ts`)
- Custom color palette
- Component styling
- Responsive breakpoints
- Dark mode support

### TypeScript Configuration (`tsconfig.json`)
- Strict type checking
- Path aliases (@/ for src/)
- Modern ES features
- Next.js optimizations

## Key Features by Directory

### Customer-Facing Features (`src/app/[locale]/`)
- Multilingual product catalog
- Shopping cart functionality
- User authentication and profiles
- Category browsing and filtering
- Responsive design

### Admin Panel Features (`src/app/admin/`)
- Product management (CRUD)
- User and role management
- Order processing
- Content management
- Analytics dashboard
- Activity logging

### API Layer (`src/app/api/`)
- RESTful API endpoints
- Authentication middleware
- Data validation with Zod
- Error handling
- File upload support

## Development Patterns

### Component Architecture
- Server and Client Components
- Compound component patterns
- Reusable UI components (Shadcn/ui)
- Context providers for state management

### Data Management
- Prisma ORM for database operations
- Type-safe database queries
- Optimistic updates
- Caching strategies

### Authentication Flow
- NextAuth.js integration
- Role-based access control
- Protected routes
- Session management

### Internationalization
- Dynamic locale routing
- Server-side translations
- Database-driven content localization
- Fallback language support

## Build and Deployment

### Development Scripts
- `npm run dev`: Start development server
- `npm run build`: Production build
- `npm run start`: Start production server
- `npm run lint`: Code linting
- `npx prisma studio`: Database GUI

### Environment Variables
- Database connection strings
- NextAuth configuration
- API keys and secrets
- Feature flags

## Code Quality and Standards

### TypeScript
- Strict type checking enabled
- Interface definitions for all data structures
- Generic types for reusable components
- Utility types for API responses

### Styling
- Tailwind CSS for utility-first styling
- Component-scoped styles
- Dark mode support
- Responsive design patterns

### Testing Structure (Planned)
```
__tests__/
├── components/
├── pages/
├── api/
└── utils/
```

This structure provides a scalable foundation for the Askim Candles e-commerce platform, supporting both customer-facing features and comprehensive admin functionality.