
"use client";

import { useParams } from 'next/navigation';
import type { Locale } from '@/lib/i1n-config';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Slash } from 'lucide-react';

// Placeholder for dictionary loading - in a real app, use getDictionary or pass props
import enMessages from '@/dictionaries/en.json';
import ruMessages from '@/dictionaries/ru.json';
import uzMessages from '@/dictionaries/uz.json';

type Dictionary = typeof enMessages;

const dictionaries: Record<Locale, Dictionary> = {
  en: enMessages,
  ru: ruMessages,
  uz: uzMessages,
};

const getSoyWaxPageDictionary = (locale: Locale) => {
  return dictionaries[locale]?.soyWaxPage || dictionaries.en.soyWaxPage;
};


export default function SoyWaxInfoPage() {
  const params = useParams();
  const locale = params.locale as Locale || 'uz';
  const dictionary = getSoyWaxPageDictionary(locale);

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
          Soy wax is a vegetable wax made from the oil of soybeans. After harvesting, the beans are cleaned,
          cracked, de-hulled, and rolled into flakes. The oil is then extracted from the flakes and hydrogenated.
        </p>
        <p>
          This process converts some of the fatty acids in the oil from unsaturated to saturated. This dramatically
          alters the melting point of the oil, making it solid at room temperature – perfect for candles!
        </p>
        <h2 className="text-2xl font-semibold mt-4 mb-2">Benefits of Soy Wax</h2>
        <ul>
          <li><strong>Natural and Renewable:</strong> Soybeans are a renewable resource.</li>
          <li><strong>Cleaner Burning:</strong> Soy wax produces significantly less soot than paraffin wax.</li>
          <li><strong>Longer Lasting:</strong> Soy candles typically burn longer than paraffin candles of the same size.</li>
          <li><strong>Better Scent Throw:</strong> Soy wax holds fragrance oils well, providing a strong and pleasant scent.</li>
        </ul>
        <p>
          At Askim candles, we choose soy wax for many of our candles because of these wonderful properties, ensuring a high-quality,
          eco-friendlier product for your enjoyment.
        </p>
      </div>
    </div>
  );
}

    