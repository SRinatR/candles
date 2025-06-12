// src/app/[locale]/page.tsx
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ProductList } from '@/components/products/ProductList';
import type { ProductCardDictionary } from '@/components/products/ProductCard';
import { mockProducts, mockCategories } from '@/lib/mock-data';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { getDictionary } from '@/lib/getDictionary';
import type { Locale } from '@/lib/i1n-config';

export default async function HomePage({ 
  params 
}: { 
  params: Promise<{ locale: Locale }> // Изменено: добавлен Promise
}) {
  const { locale } = await params; // Изменено: добавлен await и деструктуризация
  const dictionary = await getDictionary(locale);
  const activeProducts = mockProducts.filter(p => p.isActive);
  const featuredProducts = activeProducts.slice(0, 4);

  const productCardStrings: ProductCardDictionary = dictionary.productCard || {
    addToCart: "Add to Cart (Default Fallback)",
    addedToCartTitle: "Added to cart (Default Fallback)",
    addedToCartDesc: "{productName} has been added (Default Fallback).",
    outOfStock: "Out of Stock (Default Fallback)"
  };

  // Filter categories to a maximum of 5 for the homepage grid
  const displayedCategories = mockCategories.slice(0, 5);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/30 via-background to-background rounded-xl p-8 md:p-16 text-center overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-20">
           {/* You can add a subtle background pattern or image here if desired */}
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            {dictionary.homepage.heroTitle.main} <span className="text-primary">{dictionary.homepage.heroTitle.highlight}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {dictionary.homepage.heroSubtitle}
          </p>
          <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg transition-all transform hover:scale-105">
            <Link href={`/${locale}/products`}>
              {dictionary.homepage.shopAllButton} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Categories Section */}
      <section>
        <h2 className="text-3xl font-semibold tracking-tight text-center mb-8">
          {dictionary.homepage.categoriesTitle}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {displayedCategories.map((category, index) => (
            <Link
              key={category.id}
              href={`/${locale}/products?category=${encodeURIComponent(category.name.toLowerCase().replace(/\s+/g, '-'))}`}
              className="group relative aspect-square rounded-lg overflow-hidden bg-muted hover:scale-105 transition-all shadow-md hover:shadow-lg"
            >
              <Image
                src={category.image}
                alt={dictionary.categories[category.name.toLowerCase().replace(/\s+/g, '-')] || category.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
                data-ai-hint={`Category: ${category.name}`}
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                <h3 className="text-white font-medium text-sm md:text-base text-center leading-tight">
                  {dictionary.categories[category.name.toLowerCase().replace(/\s+/g, '-')] || category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold tracking-tight mb-4">
            {dictionary.homepage.featuredTitle}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {dictionary.homepage.featuredSubtitle}
          </p>
        </div>
        
        <ProductList 
          products={featuredProducts} 
          locale={locale}
          dictionary={productCardStrings}
          categoriesDict={dictionary.categories}
        />
        
        <div className="text-center mt-8">
          <Button variant="outline" size="lg" asChild>
            <Link href={`/${locale}/products`}>
              {dictionary.homepage.viewAllProducts} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}