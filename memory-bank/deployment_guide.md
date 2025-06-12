
# Deployment Guide: Askim candles

This document outlines the key steps and considerations for deploying the Askim candles application to a production environment, particularly focusing on transitioning from simulated data and authentication to real backend services using Prisma and PostgreSQL on a VPS.

## 1. Prerequisites

*   **VPS (Virtual Private Server):** You should have a VPS set up with SSH access and a Linux distribution (e.g., Ubuntu).
*   **Domain Name:** (Optional but recommended for production) A registered domain name (e.g., `askimcandles.com`). An admin-specific subdomain like `admin.askimcandles.com` would require additional DNS and reverse proxy configuration. For now, the admin panel is accessed via `/admin`.
*   **Node.js & npm/yarn:** Installed on your VPS.
*   **PostgreSQL Database:** Installed and running on your VPS, or a managed PostgreSQL service.
*   **NGINX (or similar reverse proxy):** Recommended for serving the Next.js app and handling SSL.

## 2. Backend Setup: PostgreSQL & Prisma

### 2.1. PostgreSQL Database Creation
1.  **Install PostgreSQL** on your VPS if not already present.
2.  **Create a new database** for the Askim candles application (e.g., `askim_candles_prod`).
3.  **Create a new database user** with a strong password and grant it necessary privileges on the new database. Note these credentials securely.

### 2.2. Prisma Integration
1.  **Install Prisma CLI** as a dev dependency if not already: `npm install prisma --save-dev`.
2.  **Initialize Prisma:** Run `npx prisma init --datasource-provider postgresql`. This creates a `prisma` folder with a `schema.prisma` file and updates your `.env` with a `DATABASE_URL` placeholder.
3.  **Configure `DATABASE_URL`:** Update the `DATABASE_URL` in your `.env` (and `.env.local` for development, `.env.production` for production builds) to point to your PostgreSQL database.
    ```
    DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_DB_HOST:YOUR_DB_PORT/YOUR_DB_NAME?schema=public"
    ```
4.  **Define Prisma Schema (`prisma/schema.prisma`):**
    *   Define models for `User` (for both main site and admin/manager roles), `Product`, `Category`, `Order`, `OrderItem`, `Address`, `DiscountCode`, `Client`, `AdminLog`, etc.
    *   Example `User` and `Role` enum (as per your request for admin panel roles):
        ```prisma
        generator client {
          provider = "prisma-client-js"
        }

        datasource db {
          provider = "postgresql"
          url      = env("DATABASE_URL")
        }

        model User {
          id        String   @id @default(cuid())
          email     String   @unique
          name      String?
          password  String   // Will store hashed passwords
          role      Role     @default(USER) // For main site users and admin roles
          isBlocked Boolean  @default(false)
          createdAt DateTime @default(now())
          updatedAt DateTime @updatedAt
          
          // Relations for main site user
          orders    Order[]
          addresses Address[]

          // For admin/manager roles
          // No specific fields needed here if role covers it
        }

        enum Role {
          ADMIN
          MANAGER
          USER // Main site customer
        }

        model Product {
          id            String    @id @default(cuid())
          name          String
          description   String    @db.Text
          price         Int       // Store price in smallest currency unit (e.g., UZS tiyin or cents)
          categoryName  String    // Or link to a Category model
          // category   Category @relation(fields: [categoryName], references: [name])
          images        String[]  // Array of image URLs
          mainImage     String?   // URL of the main image
          stock         Int       @default(0)
          scent         String?
          material      String?
          dimensions    String?
          burningTime   String?   // e.g., "Approx. 40 hours"
          // attributes Json?    // For flexible key-value attributes
          createdAt     DateTime  @default(now())
          updatedAt     DateTime  @updatedAt
          orderItems    OrderItem[]
        }
        
        model Category {
          id String @id @default(cuid())
          name String @unique
          slug String @unique
          description String?
          // products Product[]
        }

        model Order {
          id          String      @id @default(cuid())
          orderNumber String      @unique
          userId      String
          user        User        @relation(fields: [userId], references: [id])
          items       OrderItem[]
          totalAmount Int         // Store in smallest currency unit
          status      String      // e.g., PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED
          shippingAddress Json?   // Snapshot of shipping address
          billingAddress  Json?   // Snapshot of billing address
          createdAt   DateTime    @default(now())
          updatedAt   DateTime    @updatedAt
        }

        model OrderItem {
          id        String  @id @default(cuid())
          orderId   String
          order     Order   @relation(fields: [orderId], references: [id])
          productId String
          product   Product @relation(fields: [productId], references: [id])
          quantity  Int
          price     Int     // Price at the time of order, in smallest unit
          name      String  // Product name snapshot
          imageUrl  String? // Product image snapshot
        }
        
        model Address {
            id        String   @id @default(cuid())
            userId    String
            user      User     @relation(fields: [userId], references: [id])
            street    String
            city      String
            state     String?
            zipCode   String
            country   String
            isDefault Boolean  @default(false)
            createdAt DateTime @default(now())
            updatedAt DateTime @updatedAt
        }

        model AdminLog {
          id        String   @id @default(cuid())
          timestamp DateTime @default(now())
          userEmail String   // Email of the admin/manager performing the action
          action    String   // Description of the action
          details   Json?    // Any additional details as JSON
        }
        
        // Model for non-registered clients or a separate client list if needed
        // model Client {
        //   id        String   @id @default(cuid())
        //   email     String   @unique
        //   name      String?
        //   phone     String?
        //   // ... other client-specific fields
        //   createdAt DateTime @default(now())
        //   updatedAt DateTime @updatedAt
        // }
        ```
5.  **Database Migrations:**
    *   Create your first migration: `npx prisma migrate dev --name init` (this will also apply it).
    *   For subsequent schema changes, use `npx prisma migrate dev --name your_migration_name`.
    *   For production deployment, you'll use `npx prisma migrate deploy`.
6.  **Generate Prisma Client:** `npx prisma generate`. This command is often run automatically after migrations.

## 3. Authentication Transition

### 3.1. Admin Panel Authentication
1.  **Replace Simulated `AdminAuthContext`:**
    *   Remove `src/contexts/AdminAuthContext.tsx`.
    *   Update `src/app/admin/login/page.tsx` to use NextAuth's `signIn` with a `Credentials` provider.
    *   You will need to create a `Credentials` provider in `src/lib/authOptions.ts` (or a separate admin auth options file). This provider will:
        *   Receive email and password from the login form.
        *   Use Prisma Client to query the `User` table for a user with the given email.
        *   Compare the provided password with the hashed password stored in the database (use a library like `bcryptjs` for hashing and comparison).
        *   Return user object if credentials are valid, otherwise throw an error or return null.
        *   Ensure only users with `ADMIN` or `MANAGER` roles can log into `/admin`.
        *   The user object returned by the provider should include the `role`.
2.  **Update Admin Layout (`src/app/admin/layout.tsx`):**
    *   Use `useSession` from `next-auth/react` to get the admin user's session.
    *   Adapt role checks (`isAdmin`, `isManager`) based on the session user's role from the database (e.g., `session.user.role`).
3.  **User Management for Admins:**
    *   The "Add New Manager" form in `/admin/users/new-manager` will submit to a Server Action.
    *   This Server Action will:
        *   Verify the current user is an ADMIN.
        *   Validate input.
        *   Hash the new manager's password.
        *   Create a new `User` in the database using Prisma Client with `role: MANAGER`.

### 3.2. Main Site Authentication (Email/Password) - Optional Migration
1.  **Replace Simulated `AuthContext` (Main Site):**
    *   If you choose to migrate main site email/password auth to the database as well:
        *   Remove `src/contexts/AuthContext.tsx`.
        *   Update `src/app/[locale]/login/page.tsx` to use NextAuth `signIn` with the same (or a new) `Credentials` provider.
        *   Update `src/app/[locale]/register/page.tsx`:
            *   The form should submit to a Server Action or API Route.
            *   This action/route will:
                *   Validate input using Zod.
                *   Hash the password.
                *   Create a new `User` in the database using Prisma Client with `role: USER`.
                *   Implement email confirmation logic (sending an email with a unique token, verifying it).
2.  **Update `SessionProvider`**: Ensure it's correctly wrapping the application in `src/app/providers.tsx`.

## 4. Data Management Transition

*   **Replace Mock Data:**
    *   For product listings (`/admin/products`, main site), product details, categories, etc., replace fetching from `mock-data.ts` with Prisma Client queries via Server Actions or API Route Handlers.
    *   Admin panel forms (add/edit product) will submit to these Server Actions/API Routes, which will then use Prisma to CUD data.
    *   Client list in `/admin/clients` will fetch from the `User` table (filtering by role or a separate `Client` model if you decide to create one for non-registered clients).
    *   Log entries in `/admin/logs` will be written to and read from the `AdminLog` table.
*   **Server Components:** Leverage Server Components for data fetching where possible to improve performance.
*   **Image Uploads:** Transition `ImageUploadArea.tsx` from Data URLs to actual file uploads to a storage service (e.g., Firebase Storage, Cloudinary, or self-hosted) and store URLs in the database.

## 5. Environment Variables for Production

Ensure your `.env.production` (or server environment variables) are set correctly:
*   `DATABASE_URL` (pointing to your production PostgreSQL database)
*   `GOOGLE_CLIENT_ID`
*   `GOOGLE_CLIENT_SECRET`
*   `NEXTAUTH_SECRET` (a strong, unique secret)
*   `NEXTAUTH_URL` (your production domain, e.g., `https://askimcandles.com`)
*   Any other API keys or service credentials (e.g., for email sending, address lookup, image storage).

## 6. Building and Deploying to VPS

1.  **Build the Next.js App:**
    *   On your local machine or CI/CD pipeline: `npm run build`.
2.  **Deploy Files to VPS:**
    *   Copy the `.next` folder (the build output), `public` folder, `package.json` (and `yarn.lock` or `package-lock.json`), and the `prisma` folder to your VPS.
3.  **Install Production Dependencies on VPS:**
    *   Navigate to the deployed directory on your VPS and run `npm install --omit=dev`.
4.  **Run Prisma Migration for Production:**
    *   `npx prisma migrate deploy`
5.  **Start the Next.js App:**
    *   Use a process manager like `pm2` to run your Next.js app in production: `pm2 start npm --name "askim-candles" -- run start` (adjust `start` script in `package.json` if needed, e.g., to specify a port `next start -p 3000`).
6.  **Configure NGINX as a Reverse Proxy:**
    *   Install NGINX.
    *   Configure NGINX to listen on port 80 (and 443 for SSL) and proxy requests to your Next.js app (e.g., running on port 3000).
    *   Set up SSL using Let's Encrypt (Certbot) for HTTPS.
    *   Example NGINX site configuration snippet:
        ```nginx
        server {
            listen 80;
            server_name yourdomain.com www.yourdomain.com;

            location / {
                proxy_pass http://localhost:3000; # Assuming Next.js runs on port 3000
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
            }
            # ... other configurations like SSL
        }
        ```

## 7. Post-Deployment

*   **Testing:** Thoroughly test all functionalities in the production environment.
*   **Monitoring:** Set up logging and monitoring for your application and server.
*   **Backups:** Regularly back up your PostgreSQL database.
*   **Address Auto-Suggestion API:** Integrate an address lookup API (e.g., Google Places API, or a local provider for Uzbekistan if available) for the checkout page. This will require API keys and frontend integration.

This guide provides a high-level overview. Each step, especially backend integration and NGINX configuration, has its own complexities and requires careful attention to detail.
