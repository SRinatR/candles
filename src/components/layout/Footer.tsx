
"use client";

import { usePathname } from 'next/navigation';
import type { Locale } from '@/lib/i1n-config';
import Link from 'next/link';

interface FooterProps {
  locale: Locale;
  dictionary: {
    rightsReserved: string;
    privacyPolicy: string;
    termsOfService: string;
    contactPagePath: string;
    termsPagePath: string;
    privacyPagePath: string;
  };
}

export function Footer({ locale, dictionary }: FooterProps) {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Admin path check should be robust for localized admin paths if they exist in future
  const isAdminPath = pathname.startsWith('/admin') || (pathname.startsWith(`/${locale}/admin`));

  if (isAdminPath) {
    return null;
  }
  
  return (
    <footer className="border-t border-border/40 bg-background mt-12">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center gap-x-4 gap-y-2">
            <p>&copy; {currentYear} Askim candles. {dictionary.rightsReserved}</p>
            {/* Display version for all users. "Last Updated" is removed from main site footer. */}
            <p className="text-xs">
              v0.1.0 (Simulated)
            </p>
        </div>
        <div className="flex space-x-4">
          <Link href={`/${locale}${dictionary.privacyPagePath || '/info/privacy'}`} className="hover:text-foreground">{dictionary.privacyPolicy}</Link>
          <Link href={`/${locale}${dictionary.termsPagePath || '/info/terms'}`} className="hover:text-foreground">{dictionary.termsOfService}</Link>
        </div>
      </div>
    </footer>
  );
}
