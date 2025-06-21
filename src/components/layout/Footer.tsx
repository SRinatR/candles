
"use client";

import { usePathname } from 'next/navigation';
import { getAppVersion } from '@/lib/version';
import { useTranslations } from 'next-intl';

import type { Locale } from '@/lib/i1n-config';
import Link from 'next/link';

export function Footer() {
  const t = useTranslations('footer');
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Get current locale from pathname
  const locale = pathname.split('/')[1] as Locale || 'uz';
  // Admin path check should be robust for localized admin paths if they exist in future
  const isAdminPath = pathname.startsWith('/admin') || (pathname.startsWith(`/${locale}/admin`));

  if (isAdminPath) {
    return null;
  }
  
  return (
    <footer className="border-t border-border/40 bg-background mt-12">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center gap-x-4 gap-y-2">
            <p>&copy; {currentYear} Askim candles. {t('rightsReserved')}</p>
            {/* Display version for all users. "Last Updated" is removed from main site footer. */}
            <p className="text-xs">
              v{getAppVersion()}
            </p>
        </div>
        <div className="flex space-x-4">
          <Link href={`/${locale}${t('privacyPagePath') || '/info/privacy'}`} className="hover:text-foreground">{t('privacyPolicy')}</Link>
          <Link href={`/${locale}${t('termsPagePath') || '/info/terms'}`} className="hover:text-foreground">{t('termsOfService')}</Link>
        </div>
      </div>
    </footer>
  );
}
