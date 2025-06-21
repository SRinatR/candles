# Development Notes: Askim Candles

## Current Development Status

### ✅ Completed Components

#### Database & Backend
- **Prisma Schema**: Comprehensive database schema with 24 models
- **Authentication**: NextAuth.js with Google OAuth and credentials provider
- **API Routes**: Basic CRUD operations for products, users, categories
- **Role System**: USER, ADMIN, MANAGER roles with proper access control
- **Internationalization**: Database support for multilingual content

#### Admin Panel Foundation
- **Layout**: Complete admin layout with navigation and theming
- **Dashboard**: Basic dashboard with metrics display
- **User Management**: User listing and role management
- **Authentication**: Admin login system with role verification
- **UI Components**: Shadcn/ui integration with custom styling

#### Core Infrastructure
- **Next.js 15**: App Router with TypeScript
- **Tailwind CSS 4.x**: Modern styling with dark mode support
- **Type Safety**: Comprehensive TypeScript interfaces
- **Development Environment**: Hot reload, linting, formatting

### 🔄 In Progress

#### Product Management
- **Frontend**: Product listing and filtering UI
- **Image Upload**: File upload system implementation
- **Validation**: Zod schemas for product data
- **Multilingual**: Product translation management

#### Customer Site
- **Product Catalog**: Browse and search functionality
- **Shopping Cart**: Cart state management
- **User Profiles**: Customer account management
- **Checkout Flow**: Order processing system

### 📋 Planned Features

#### High Priority
1. **Payment Integration**:  local payment providers
2. **Order Management**: Complete order lifecycle
3. **Inventory Tracking**: Stock management system
4. **Email Notifications**: Order confirmations, updates
5. **Review System**: Customer product reviews

#### Medium Priority
1. **Advanced Search**: Elasticsearch integration
2. **Analytics**: Sales and user behavior tracking
3. **SEO Optimization**: Meta tags, sitemaps, structured data
4. **Performance**: Image optimization, caching
5. **Mobile App**: React Native or PWA

#### Low Priority
1. **AI Recommendations**: Product suggestion engine
2. **Social Integration**: Social media sharing
3. **Loyalty Program**: Customer rewards system
4. **Multi-vendor**: Support for multiple sellers
5. **Advanced Reporting**: Business intelligence dashboard

## Technical Decisions & Rationale

### Architecture Choices

#### Next.js 15 App Router
**Why**: 
- Server-side rendering for SEO
- File-based routing simplicity
- Built-in API routes
- Excellent TypeScript support
- Active development and community

#### PostgreSQL + Prisma
**Why**:
- ACID compliance for e-commerce
- Complex relational data modeling
- Type-safe database queries
- Excellent migration system
- Performance and scalability

#### NextAuth.js
**Why**:
- Industry standard for Next.js
- Multiple provider support
- Session management
- Security best practices
- Easy role-based access control

#### Tailwind CSS 4.x
**Why**:
- Utility-first approach
- Excellent performance
- Design system consistency
- Dark mode support
- Responsive design utilities

### Database Design Decisions

#### Multilingual Support
- **Pattern**: Separate translation tables (ProductTranslation, CategoryTranslation)
- **Benefit**: Flexible language support without schema changes
- **Trade-off**: More complex queries, but better data integrity

#### User Role System
- **Roles**: USER (customer), ADMIN (full access), MANAGER (limited admin)
- **Implementation**: Enum-based with middleware protection
- **Scalability**: Easy to extend with new roles

#### Product Catalog Structure
- **Categories**: Hierarchical with translations
- **Materials**: Separate entity for filtering
- **Images**: Dedicated table with ordering support
- **Variants**: Planned for size/color variations

## Development Workflow

### Git Strategy
- **Main Branch**: Production-ready code
- **Develop Branch**: Integration branch for features
- **Feature Branches**: Individual feature development
- **Hotfix Branches**: Critical production fixes

### Code Quality Standards

#### TypeScript
- Strict mode enabled
- No `any` types allowed
- Interface definitions for all data structures
- Generic types for reusable components

#### Component Standards
- Server Components by default
- Client Components only when necessary
- Props interfaces for all components
- Consistent naming conventions

#### API Standards
- RESTful endpoint design
- Zod validation for all inputs
- Consistent error response format
- Proper HTTP status codes

### Testing Strategy (Planned)

#### Unit Tests
- **Framework**: Jest + React Testing Library
- **Coverage**: Utility functions, hooks, components
- **Target**: 80%+ code coverage

#### Integration Tests
- **Framework**: Playwright
- **Coverage**: API endpoints, user flows
- **Environment**: Dedicated test database

#### E2E Tests
- **Framework**: Playwright
- **Coverage**: Critical user journeys
- **Frequency**: Pre-deployment validation

## Performance Considerations

### Frontend Optimization
- **Images**: Next.js Image component with optimization
- **Fonts**: Local font hosting with preload
- **Bundle Size**: Dynamic imports for large components
- **Caching**: Aggressive caching for static content

### Backend Optimization
- **Database**: Proper indexing on frequently queried fields
- **API**: Response caching for read-heavy endpoints
- **Images**: CDN integration for media files
- **Monitoring**: Performance tracking and alerting

### SEO Strategy
- **Meta Tags**: Dynamic generation based on content
- **Structured Data**: Product and organization schemas
- **Sitemaps**: Automated generation for products/categories
- **Page Speed**: Core Web Vitals optimization

## Security Considerations

### Authentication Security
- **Session Management**: Secure HTTP-only cookies
- **Password Hashing**: bcrypt with proper salt rounds
- **OAuth Security**: Proper state validation
- **Rate Limiting**: API endpoint protection

### Data Protection
- **Input Validation**: Zod schemas for all user inputs
- **SQL Injection**: Prisma ORM protection
- **XSS Prevention**: React's built-in protection + CSP
- **CSRF Protection**: NextAuth.js built-in protection

### Admin Panel Security
- **Role Verification**: Middleware-based access control
- **Audit Logging**: All admin actions logged
- **Session Timeout**: Automatic logout for inactive sessions
- **IP Restrictions**: Optional IP whitelisting for admin access

## Deployment Strategy

### Environment Setup
- **Development**: Local PostgreSQL + hot reload
- **Staging**: Production-like environment for testing
- **Production**: Optimized build with monitoring

### CI/CD Pipeline (Planned)
1. **Code Push**: Trigger automated pipeline
2. **Tests**: Run unit, integration, and E2E tests
3. **Build**: Create optimized production build
4. **Deploy**: Deploy to staging for validation
5. **Production**: Manual promotion after approval

### Monitoring & Logging
- **Application Monitoring**: Error tracking and performance
- **Database Monitoring**: Query performance and health
- **User Analytics**: Behavior tracking and conversion metrics
- **Security Monitoring**: Failed login attempts and suspicious activity

## Known Issues & Technical Debt

### Current Issues
1. **Image Upload**: Needs proper file validation and storage
2. **Error Handling**: Inconsistent error messages across API
3. **Loading States**: Missing loading indicators in admin panel
4. **Mobile Optimization**: Admin panel needs mobile improvements

### Technical Debt
1. **Mock Data**: Replace with proper database seeding
2. **Type Definitions**: Some API responses need better typing
3. **Component Refactoring**: Large components need splitting
4. **Performance**: Database queries need optimization

### Future Refactoring
1. **State Management**: Consider Zustand for complex state
2. **API Layer**: Implement proper API client with caching
3. **Component Library**: Extract reusable components
4. **Microservices**: Consider service separation for scale

## Development Environment Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git
- VS Code (recommended)

### Quick Start
```bash
# Clone repository
git clone [repository-url]
cd candles

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your database credentials

# Setup database
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev
```

### Useful Commands
```bash
# Database management
npx prisma studio          # Database GUI
npx prisma migrate reset   # Reset database
npx prisma generate        # Regenerate client

# Development
npm run dev                # Start dev server
npm run build              # Production build
npm run lint               # Code linting
npm run type-check         # TypeScript checking
```

This document serves as a living reference for the development team and should be updated as the project evolves.