
import { redirect } from 'next/navigation';
import { i18n } from '@/lib/i1n-config';

// This root page redirects to the default locale.
// The actual homepage content is in /app/[locale]/page.tsx
export default function RootPage() {
  redirect(`/${i18n.defaultLocale}`);
}
