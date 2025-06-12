
"use client";

import React, { useEffect, useState }from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Locale, Article } from '@/lib/types';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, BookText } from 'lucide-react';
import { Slash } from 'lucide-react';
import Image from 'next/image';

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
    page: dict.usefulInfoPage,
    nav: dict.navigation,
  };
};

const ARTICLES_STORAGE_KEY = "askimAdminArticles";

export default function UsefulInfoPage() {
  const params = useParams();
  const locale = params.locale as Locale || 'uz';
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageDicts, setPageDicts] = useState<{page: UsefulInfoPageDict, nav: NavigationDict} | null>(null);

  useEffect(() => {
    setPageDicts(getPageDictionaries(locale));
    if (typeof window !== 'undefined') {
      const storedArticlesRaw = localStorage.getItem(ARTICLES_STORAGE_KEY);
      const allStoredArticles: Article[] = storedArticlesRaw ? JSON.parse(storedArticlesRaw) : [];
      setArticles(allStoredArticles.filter(art => art.isActive));
      setIsLoading(false);
    }
  }, [locale]);

  if (isLoading || !pageDicts) {
    return <div className="container mx-auto py-8 px-4 text-center">Loading useful information...</div>;
  }
  
  const dictionary = pageDicts.page;
  const navDictionary = pageDicts.nav;

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${locale}/`}>{navDictionary.home}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator><Slash /></BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>{dictionary.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">{dictionary.title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{dictionary.description}</p>
      </header>
      
      {articles.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {articles.map((article) => {
            const articleTitle = article.title[locale] || article.title.en;
            // For teaser, we can take the first few words of the English content or create a dedicated teaser field later
            const articleTeaser = (article.content[locale] || article.content.en).substring(0, 100) + "...";
            
            let imageUrlToDisplay: string | undefined = undefined;
            if (article.useSharedImage && article.sharedMainImage) {
              imageUrlToDisplay = article.sharedMainImage;
            } else {
              const langImageKey = `mainImage_${locale}` as keyof Article;
              imageUrlToDisplay = article[langImageKey] as string | undefined;
               if (!imageUrlToDisplay && article.mainImage_en) { 
                  imageUrlToDisplay = article.mainImage_en;
              }
            }
            if (!imageUrlToDisplay) imageUrlToDisplay = "https://placehold.co/600x400.png?text=Article";


            return (
              <Card key={article.id} className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
                {imageUrlToDisplay && (
                  <div className="relative w-full h-48 rounded-t-lg overflow-hidden">
                    <Image 
                      src={imageUrlToDisplay} 
                      alt={articleTitle} 
                      fill 
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                      data-ai-hint="article preview"
                    />
                  </div>
                )}
                <CardHeader className="pb-3">
                   <CardTitle className="text-xl">{articleTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 flex-grow">
                  <CardDescription className="line-clamp-3">{articleTeaser}</CardDescription>
                </CardContent>
                <CardContent className="pt-0">
                   <Button variant="outline" asChild className="w-full sm:w-auto mt-auto">
                    <Link href={`/${locale}/info/${article.slug}`}>
                      {dictionary.readMoreButton} <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">{dictionary.noArticlesYet || "No articles available yet."}</p>
      )}
    </div>
  );
}
