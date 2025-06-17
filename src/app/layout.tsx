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
  // Next.js requires html and body tags in root layout
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
