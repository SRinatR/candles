import type { Metadata } from 'next';
// Removed direct redirect import as page.tsx handles it.
import { i18n } from '@/lib/i1n-config';

// This root layout only redirects to the default locale via page.tsx
// All actual content and main layout are in /app/[locale]/layout.tsx

export const metadata: Metadata = {
  title: 'Askim candles',
  description: 'Discover artisanal candles, wax figures, and gypsum products from Askim candles.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This component will not be rendered directly as page.tsx redirects.
  // However, Next.js requires a root layout.
  return (
    <html lang={i18n.defaultLocale} suppressHydrationWarning>
      <body suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
