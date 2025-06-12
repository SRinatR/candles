
// This file is deprecated and will be deleted.
// Content has been moved to src/app/[locale]/account/profile/page.tsx
export default function DeprecatedProfilePage() {
  if (typeof window !== 'undefined') {
    const segments = window.location.pathname.split('/');
    const localeSegment = segments[1];
    const validLocales = ['en', 'ru', 'uz'];
    const locale = validLocales.includes(localeSegment) ? localeSegment : 'uz';
    window.location.href = `/${locale}/account/profile`;
  }
  return null;
}
