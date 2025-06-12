
"use client";

import { useParams } from 'next/navigation';
import type { Locale } from '@/lib/i1n-config';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Slash } from 'lucide-react';

// Placeholder for dictionary loading
import enMessages from '@/dictionaries/en.json';
import ruMessages from '@/dictionaries/ru.json';
import uzMessages from '@/dictionaries/uz.json';

type Dictionary = typeof enMessages;

const dictionaries: Record<Locale, Dictionary> = {
  en: enMessages,
  ru: ruMessages,
  uz: uzMessages,
};

const getAromaSachetPageDictionary = (locale: Locale) => {
  return dictionaries[locale]?.aromaSachetPage || dictionaries.en.aromaSachetPage;
};


export default function AromaSachetInfoPage() {
  const params = useParams();
  const locale = params.locale as Locale || 'uz';
  const dictionary = getAromaSachetPageDictionary(locale);

  return (
    <div className="container mx-auto py-8 px-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${locale}/`}>{dictionary.breadcrumbHome}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator><Slash /></BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>{dictionary.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold my-6">{dictionary.title}</h1>
      <div className="prose dark:prose-invert max-w-none">
        <p>{dictionary.placeholderContent}</p>
        {/* Add more detailed content here */}
        <p>
          Aroma sachets are small, often decorative bags or pouches filled with scented materials.
          They are designed to release a pleasant fragrance into small spaces over a period of time.
        </p>
        <h2 className="text-2xl font-semibold mt-4 mb-2">How to Use Aroma Sachets:</h2>
        <ul>
          <li><strong>Drawers and Closets:</strong> Keep your clothes and linens smelling fresh by placing sachets in drawers or hanging them in closets.</li>
          <li><strong>Cars:</strong> A great way to maintain a pleasant aroma in your vehicle.</li>
          <li><strong>Luggage:</strong> Tuck a sachet into your suitcase when traveling to keep contents fresh.</li>
          <li><strong>Storage Boxes:</strong> Prevent musty odors in stored items like seasonal clothing or decorations.</li>
          <li><strong>Gift Baskets:</strong> Add a fragrant touch to gift baskets.</li>
          <li><strong>Near Pet Areas:</strong> Help neutralize pet odors (ensure they are out of reach of pets).</li>
        </ul>
        <h2 className="text-2xl font-semibold mt-4 mb-2">Tips for Aroma Sachets:</h2>
        <ul>
          <li>Gently shake or knead the sachet occasionally to refresh the scent.</li>
          <li>Avoid placing directly on polished or painted surfaces, as the oils may cause damage.</li>
          <li>Keep out of reach of children and pets.</li>
          <li>The lifespan of a sachet varies depending on its size, ingredients, and environment, but typically they last for several weeks to a few months.</li>
        </ul>
        <p>
          Askim candles offers a variety of aroma sachets to bring delightful scents to your personal spaces.
        </p>
      </div>
    </div>
  );
}

    