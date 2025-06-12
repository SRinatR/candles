
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import type { Locale, Article } from '@/lib/types';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Slash } from 'lucide-react';
import Image from 'next/image';

// Simulating dictionary loading for client component
import enMessages from '@/dictionaries/en.json';
import ruMessages from '@/dictionaries/ru.json';
import uzMessages from '@/dictionaries/uz.json';

type FullDictionary = typeof enMessages;
type UsefulInfoPageDict = FullDictionary['usefulInfoPage'];
type NavigationDict = FullDictionary['navigation'];

const dictionaries: Record<Locale, FullDictionary> = {
  en: enMessages,
  ru: ruMessages,
  uz: uzMessages,
};

const getPageDictionaries = (locale: Locale) => {
  const dict = dictionaries[locale] || dictionaries.en;
  return {
    nav: dict.navigation,
    usefulInfo: dict.usefulInfoPage,
    // Individual article content will come from the Article object itself
  };
};

const ARTICLES_STORAGE_KEY = "askimAdminArticles";

export default function ArticleSlugPage() {
  const params = useParams();
  const locale = params.locale as Locale || 'uz';
  const slug = params.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageDicts, setPageDicts] = useState<{nav: NavigationDict, usefulInfo: UsefulInfoPageDict} | null>(null);

  useEffect(() => {
    setPageDicts(getPageDictionaries(locale));

    if (typeof window !== 'undefined') {
      const storedArticlesRaw = localStorage.getItem(ARTICLES_STORAGE_KEY);
      const articles: Article[] = storedArticlesRaw ? JSON.parse(storedArticlesRaw) : [];
      const foundArticle = articles.find(art => art.slug === slug && art.isActive);
      
      if (foundArticle) {
        setArticle(foundArticle);
      }
      setIsLoading(false);
    }
  }, [locale, slug]);

  if (isLoading) {
    return <div className="container mx-auto py-8 px-4 text-center">Loading article...</div>;
  }

  if (!article) {
    notFound();
  }
  
  if (!pageDicts) { // Dictionaries not loaded yet
    return <div className="container mx-auto py-8 px-4 text-center">Loading translations...</div>;
  }

  const articleTitle = article.title[locale] || article.title.en;
  const articleContent = article.content[locale] || article.content.en;

  let imageUrlToDisplay: string | undefined = undefined;
  if (article.useSharedImage && article.sharedMainImage) {
    imageUrlToDisplay = article.sharedMainImage;
  } else {
    const langImageKey = `mainImage_${locale}` as keyof Article;
    imageUrlToDisplay = article[langImageKey] as string | undefined;
    if (!imageUrlToDisplay && article.mainImage_en) { // Fallback to English image
        imageUrlToDisplay = article.mainImage_en;
    }
  }


  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${locale}/`}>{pageDicts.nav.home}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator><Slash /></BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${locale}/info`}>{pageDicts.nav.usefulInfo}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator><Slash /></BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>{articleTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {imageUrlToDisplay && (
        <div className="relative w-full h-64 md:h-96 my-8 rounded-lg overflow-hidden shadow-lg">
          <Image
            src={imageUrlToDisplay}
            alt={articleTitle}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
            data-ai-hint="article illustration"
          />
        </div>
      )}

      <article className="prose dark:prose-invert max-w-none mt-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">{articleTitle}</h1>
        <div dangerouslySetInnerHTML={{ __html: articleContent.replace(/\n/g, '<br />') }} />
      </article>
    </div>
  );
}
