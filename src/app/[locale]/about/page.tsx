
"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Slash, Heart, Leaf, Lightbulb } from 'lucide-react';
import { useParams } from 'next/navigation';
import type { Locale } from '@/lib/i1n-config';

import enMessages from '@/dictionaries/en.json';
import ruMessages from '@/dictionaries/ru.json';
import uzMessages from '@/dictionaries/uz.json';

type Dictionary = typeof enMessages; // Assuming en.json has all keys

const dictionaries: Record<Locale, Dictionary> = {
  en: enMessages,
  ru: ruMessages,
  uz: uzMessages,
};

const getAboutUsPageDictionary = (locale: Locale) => {
  const dict = dictionaries[locale] || dictionaries.en;
  return dict.aboutUsPage;
};


export default function AboutUsPage() {
  const params = useParams();
  const locale = params.locale as Locale || 'uz'; 
  const dictionary = getAboutUsPageDictionary(locale);


  return (
    <div className="space-y-10">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${locale}/`}>{dictionary.homeBreadcrumb || "Home"}</BreadcrumbLink> {}
          </BreadcrumbItem>
          <BreadcrumbSeparator><Slash /></BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>{dictionary.pageTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          {dictionary.heroTitleMain} <span className="text-primary">{dictionary.heroTitleHighlight}</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          {dictionary.heroSubtitle}
        </p>
      </header>

      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-3xl font-semibold text-foreground mb-4">{dictionary.ourStoryTitle}</h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            {dictionary.ourStoryP1}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {dictionary.ourStoryP2}
          </p>
        </div>
        <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
          <Image 
            src="https://placehold.co/600x400.png" 
            alt="Artisanal workshop" 
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            data-ai-hint="artisanal workshop"
          />
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold text-center text-foreground mb-8">{dictionary.valuesTitle}</h2>
        <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="items-center text-center">
              <div className="p-3 bg-primary/20 rounded-full mb-3">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">{dictionary.passionTitle}</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              {dictionary.passionDesc}
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="items-center text-center">
              <div className="p-3 bg-primary/20 rounded-full mb-3">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">{dictionary.qualityTitle}</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              {dictionary.qualityDesc}
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="items-center text-center">
              <div className="p-3 bg-primary/20 rounded-full mb-3">
                <Lightbulb className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">{dictionary.inspiredTitle}</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              {dictionary.inspiredDesc}
            </CardContent>
          </Card>
        </div>
      </section>
      
      <section className="text-center bg-secondary/50 rounded-xl p-8 md:p-12 shadow-md">
        <h2 className="text-2xl md:text-3xl font-semibold text-secondary-foreground mb-4">{dictionary.communityTitle}</h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-6">
          {dictionary.communityDesc}
        </p>
      </section>
    </div>
  );
}
