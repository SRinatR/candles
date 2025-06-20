
import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { i18n } from './lib/i1n-config';
import type { Locale } from './lib/i1n-config';

function getLocale(request: NextRequest): Locale {
  // Implement your locale detection logic here if needed (e.g., from headers, cookies)
  // For now, we'll just use the defaultLocale or the one in the path
  const pathname = request.nextUrl.pathname;
  const pathnameLocale = i18n.locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameLocale) return pathnameLocale;
  
  // If no locale in path, try to get from cookie or accept-language header (more advanced)
  // For simplicity, fallback to default
  return i18n.defaultLocale;
}

// Admin middleware with authentication
const adminMiddleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Allow access to admin signin page
    if (pathname === '/admin/auth/signin') {
      return NextResponse.next();
    }

    // Check if user has admin or manager role
    if (token?.role !== 'ADMIN' && token?.role !== 'MANAGER') {
      return NextResponse.redirect(new URL('/admin/auth/signin', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to admin signin page without authentication
        if (pathname === '/admin/auth/signin') {
          return true;
        }
        
        // For admin routes, require authentication
        if (pathname.startsWith('/admin')) {
          return !!token;
        }
        
        return true;
      },
    },
  }
);

// Main middleware function
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Handle admin routes with authentication
  if (pathname.startsWith('/admin')) {
    return adminMiddleware(request as any);
  }

  // Skip API, static files, and Next.js specific paths
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') // Typically files like .png, .ico, .js, .css
  ) {
    return NextResponse.next();
  }

  // Check if there is any supported locale in the pathname
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request); // Use detected or default locale

    // Construct the new URL with the locale prefix
    // Ensures that paths like /products become /uz/products
    // And / becomes /uz
    const newUrl = new URL(
      `/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`,
      request.url
    );
    
    return NextResponse.redirect(newUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Matcher including admin paths for authentication and i18n for other routes
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/support/:path*',
    '/((?!api|_next/static|_next/image|admin|favicon.ico|images).*)',
  ],
};
