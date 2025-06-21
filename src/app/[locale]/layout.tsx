// src/app/[locale]/layout.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Providers } from '@/app/providers';
import { i18n, type Locale } from '@/lib/i1n-config';
import '@/app/globals.css';

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  // Ensure locale is valid
  const resolvedParams = await params;
  const locale = (resolvedParams?.locale as Locale) || 'uz';
  
  // Validate locale
  if (!i18n.locales.includes(locale as any)) {
    notFound();
  }
  
  const messages = await getMessages();
  
  return {
    title: (messages as any)?.metadata?.title || 'Candles Shop',
    description: (messages as any)?.metadata?.description || 'Premium candles for your home',
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  // Ensure locale is valid
  const resolvedParams = await params;
  const locale = (resolvedParams?.locale as Locale) || 'uz';
  
  // Validate locale
  if (!i18n.locales.includes(locale as any)) {
    notFound();
  }
  
  const messages = await getMessages();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Providers>
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
      </Providers>
    </div>
  );
}