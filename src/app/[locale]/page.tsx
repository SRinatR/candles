// src/app/[locale]/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ProductList } from '@/components/products/ProductList';
import { ProductListSkeleton } from '@/components/products/ProductCardSkeleton';
import { CategoryGridSkeleton } from '@/components/products/CategoryCardSkeleton';
import type { ProductCardDictionary } from '@/components/products/ProductCard';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/i1n-config';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import type { Product, Category } from '@/lib/types';

export default function HomePage() {
  const params = useParams();
  const locale = (params?.locale as Locale) || 'uz';
  const t = useTranslations('homepage');
  const tNav = useTranslations('navigation');
  const tCategories = useTranslations('categories');
  const [activeProducts, setActiveProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products?isActive=true&limit=6&locale=' + locale),
          fetch('/api/categories?limit=5')
        ]);
        
        if (productsRes.ok && categoriesRes.ok) {
          const productsData = await productsRes.json();
          const categoriesData = await categoriesRes.json();
          
          setActiveProducts(productsData.products || []);
          setCategories(categoriesData.categories || []);
        }
      } catch (error) {
        // Handle error silently in production
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locale]);

  const featuredProducts = activeProducts.slice(0, 4);

  // Get product card translations
  const productCardStrings: ProductCardDictionary = {
    addToCart: tNav('addToCart') || 'Add to Cart',
    addedToCartTitle: tNav('addedToCartTitle') || 'Added to Cart',
    addedToCartDesc: tNav('addedToCartDesc', { productName: '' }) || 'Product added successfully',
    outOfStock: tNav('outOfStock') || 'Out of Stock'
  };

  // Create a function to get translated description with product name
  const getAddedToCartDesc = (productName: string) => {
    return tNav('addedToCartDesc', { productName }) || `${productName} has been added to your cart.`;
  };

  // Filter categories to a maximum of 5 for the homepage grid
  const displayedCategories = categories.slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-12">
        {/* Hero Section Skeleton */}
        <section className="relative bg-gradient-to-r from-primary/10 to-secondary/10 py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="h-12 bg-muted animate-pulse rounded-lg mx-auto w-3/4"></div>
              <div className="h-6 bg-muted animate-pulse rounded-lg mx-auto w-1/2"></div>
              <div className="h-10 bg-muted animate-pulse rounded-lg mx-auto w-32"></div>
            </div>
          </div>
        </section>

        {/* Categories Section Skeleton */}
        <section className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="h-8 bg-muted animate-pulse rounded-lg mx-auto w-64 mb-4"></div>
            <div className="h-4 bg-muted animate-pulse rounded-lg mx-auto w-96"></div>
          </div>
          <CategoryGridSkeleton count={5} />
        </section>

        {/* Featured Products Section Skeleton */}
        <section className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="h-8 bg-muted animate-pulse rounded-lg mx-auto w-72 mb-4"></div>
            <div className="h-4 bg-muted animate-pulse rounded-lg mx-auto w-80"></div>
          </div>
          <ProductListSkeleton count={4} />
          <div className="text-center mt-8">
            <div className="h-10 bg-muted animate-pulse rounded-lg mx-auto w-40"></div>
          </div>
        </section>
      </div>
    );
  }

  // Get homepage translations
  const heroTitleMain = t('heroTitle.main');
  const heroTitleHighlight = t('heroTitle.highlight');
  const heroSubtitle = t('heroSubtitle');
  const shopAllButton = t('shopAllButton');
  const categoriesTitle = t('categoriesTitle');
  const featuredTitle = t('featuredProductsTitle');
  const featuredSubtitle = t('featuredSubtitle') || 'Discover our handpicked selection';
  const viewAllProducts = t('viewAllButton');

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/30 via-background to-background rounded-xl p-8 md:p-16 text-center overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-20">
           {/* You can add a subtle background pattern or image here if desired */}
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            {heroTitleMain} <span className="text-primary">{heroTitleHighlight}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {heroSubtitle}
          </p>
          <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg transition-all transform hover:scale-105">
            <Link href={`/${locale}/products`}>
              {shopAllButton} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Categories Section */}
      <section>
        <h2 className="text-3xl font-semibold tracking-tight text-center mb-8">
          {categoriesTitle}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {displayedCategories.map((category, index) => {
            const categoryName = category.name?.[locale] || category.name?.en || category.name?.uz || category.slug || 'Category';
            const translatedCategoryName = tCategories(category.slug) || categoryName;
            const displayName = translatedCategoryName;
            
            return (
            <Link
              key={category.id}
              href={`/${locale}/products?category=${encodeURIComponent(category.slug || categoryName.toLowerCase().replace(/\s+/g, '-'))}`}
              className="group relative aspect-square rounded-lg overflow-hidden bg-muted hover:scale-105 transition-all shadow-md hover:shadow-lg"
            >
              <Image
                src={category.image || 'https://placehold.co/400x400/E5E7EB/9CA3AF?text=No+Image'}
                alt={displayName}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
                data-ai-hint={`Category: ${categoryName}`}
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                <h3 className="text-white font-medium text-sm md:text-base text-center leading-tight">
                  {displayName}
                </h3>
              </div>
            </Link>
            );
           })}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold tracking-tight mb-4">
            {featuredTitle}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {featuredSubtitle}
          </p>
        </div>
        
        <ProductList 
          products={featuredProducts} 
          locale={locale}
          dictionary={productCardStrings}
          getAddedToCartDesc={getAddedToCartDesc}
        />
        
        <div className="text-center mt-8">
          <Button variant="outline" size="lg" asChild>
            <Link href={`/${locale}/products`}>
              {viewAllProducts} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}