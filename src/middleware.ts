
import createMiddleware from 'next-intl/middleware';
import { i18n } from './lib/i1n-config';

export default createMiddleware({
  // A list of all locales that are supported
  locales: i18n.locales,

  // Used when no locale matches
  defaultLocale: i18n.defaultLocale,

  // Skip admin, API, static files, and Next.js specific paths
  pathnames: {
    // If all locales use the same pathname, a single
    // external path can be used for all locales
    '/': '/',
    '/products': '/products',
    '/about': '/about',
    '/info': '/info',
    '/cart': '/cart',
    '/checkout': '/checkout',
    '/login': '/login',
    '/register': '/register',
    '/account': '/account'
  }
});

export const config = {
  // Matcher ignoring `/_next/` and `/api/` and static files.
  // Also ignoring /admin paths specifically.
  matcher: ['/((?!api|_next/static|_next/image|admin|favicon.ico|images).*)'],
};
