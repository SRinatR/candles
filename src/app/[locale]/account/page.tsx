
"use client";
import { useEffect } from 'react';
import { useRouter, useParams }  from 'next/navigation';
import type { Locale } from '@/lib/i1n-config';

export default function AccountPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as Locale || 'uz';

  useEffect(() => {
    router.replace(`/${locale}/account/profile`);
  }, [router, locale]);

  return null; // Or a loading spinner
}

// Delete original: src/app/account/page.tsx
