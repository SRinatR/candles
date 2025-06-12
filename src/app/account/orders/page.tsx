
// This file is deprecated and will be deleted.
// Content has been moved to src/app/[locale]/account/orders/page.tsx
export default function DeprecatedOrdersPage() {
  if (typeof window !== 'undefined') {
    const segments = window.location.pathname.split('/');
    const localeSegment = segments[1];
    const validLocales = ['en', 'ru', 'uz'];
    const locale = validLocales.includes(localeSegment) ? localeSegment : 'uz';
    window.location.href = `/${locale}/account/orders`;
  }
  return null;
}
