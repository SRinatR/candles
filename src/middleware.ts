
import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['uz', 'ru', 'en'],
 
  // Used when no locale matches
  defaultLocale: 'uz',
  
  // Always use locale prefix
  localePrefix: 'always'
});

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip admin, API, static files, and Next.js specific paths
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') // Typically files like .png, .ico, .js, .css
  ) {
    return;
  }

  // Handle internationalization for all other paths
  return intlMiddleware(request);
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/` and static files.
  // Also ignoring /admin paths specifically.
  matcher: ['/((?!api|_next/static|_next/image|admin|favicon.ico|images).*)'],
};
