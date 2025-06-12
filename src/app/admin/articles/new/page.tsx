
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page simply redirects to the unified form page with 'new' as the ID.
export default function NewArticleRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/articles/form/new');
  }, [router]);

  // It's good practice to return null or a loading indicator during redirection.
  return <div>Loading new article form...</div>; 
}
