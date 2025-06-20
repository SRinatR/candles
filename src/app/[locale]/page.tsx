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
import { getDictionary } from '@/lib/getDictionary';
import type { Locale } from '@/lib/i1n-config';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import type { Product, Category } from '@/lib/types';

export default function HomePage() {
  const params = useParams();
  const locale = params.locale as Locale;
  const [dictionary, setDictionary] = useState<any>(null);
  const [activeProducts, setActiveProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dictionaryData, productsRes, categoriesRes] = await Promise.all([
          getDictionary(locale),
          fetch('/api/products?isActive=true&limit=6&locale=' + locale),
          fetch('/api/categories?limit=5')
        ]);
        
        setDictionary(dictionaryData);
        
        if (productsRes.ok && categoriesRes.ok) {
          const productsData = await productsRes.json();
          const categoriesData = await categoriesRes.json();
          
          setActiveProducts(productsData.products || []);
          setCategories(categoriesData.categories || []);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [locale]);
  const featuredProducts = activeProducts.slice(0, 4);

  const productCardStrings: ProductCardDictionary = dictionary?.productCard || {
    addToCart: "Add to Cart (Default Fallback)",
    addedToCartTitle: "Added to cart (Default Fallback)",
    addedToCartDesc: "{productName} has been added (Default Fallback).",
    outOfStock: "Out of Stock (Default Fallback)"
  };

  // Filter categories to a maximum of 5 for the homepage grid
  const displayedCategories = categories.slice(0, 5);

  if (loading || !dictionary) {
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
        <CategoryGridSkeleton count={5} />

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

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/30 via-background to-background rounded-xl p-8 md:p-16 text-center overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-20">
           {/* You can add a subtle background pattern or image here if desired */}
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            {dictionary?.homepage?.heroTitle?.main || 'Perfect'} <span className="text-primary">{dictionary?.homepage?.heroTitle?.highlight || 'Fragrance'}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {dictionary?.homepage?.heroSubtitle || 'Discover our amazing collection of handcrafted candles.'}
          </p>
          <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg transition-all transform hover:scale-105">
            <Link href={`/${locale}/products`}>
              {dictionary?.homepage?.shopAllButton || 'Shop All'} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {dictionary?.homepage?.categoriesTitle || 'Product Categories'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {dictionary?.homepage?.categoriesSubtitle || 'Explore our carefully curated collection of premium candles and home fragrances.'}
          </p>
        </div>
        
        {/* Dynamic grid based on categories count */}
        <div className={`
          grid gap-6 justify-center transition-all duration-500 ease-in-out
          ${displayedCategories.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : ''}
          ${displayedCategories.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' : ''}
          ${displayedCategories.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto' : ''}
          ${displayedCategories.length === 4 ? 'grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto' : ''}
          ${displayedCategories.length >= 5 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' : ''}
        `}>
          {displayedCategories.map((category, index) => {
            const categoryCount = displayedCategories.length;
            const categoryName = dictionary?.categories?.[category.name.toLowerCase().replace(/\s+/g, '-')] || category.name;
            const textLength = categoryName.length;
            
            // Helper functions for dynamic styling
            const getAspectRatio = () => {
              if (categoryCount === 1) return 'aspect-[4/3]';
              if (categoryCount === 2) return 'aspect-[3/4]';
              if (categoryCount === 3) return 'aspect-square';
              return 'aspect-[4/5]';
            };
            
            const getContainerPadding = () => {
              const basePadding = Math.max(2, Math.min(6, Math.ceil(textLength / 8)));
              const scaleFactor = categoryCount === 1 ? 1.4 : categoryCount === 2 ? 1.2 : 1;
              const finalPadding = Math.ceil(basePadding * scaleFactor);
              return `p-${Math.min(finalPadding, 6)} md:p-${Math.min(finalPadding + 2, 8)}`;
            };
            
            const getInnerPadding = () => {
              const basePaddingX = Math.max(2, Math.min(5, Math.ceil(textLength / 12)));
              const basePaddingY = Math.max(1, Math.min(3, Math.ceil(textLength / 18)));
              const scaleX = categoryCount === 1 ? 1.3 : categoryCount === 2 ? 1.1 : 1;
              const scaleY = categoryCount === 1 ? 1.2 : categoryCount === 2 ? 1.1 : 1;
              
              const finalPaddingX = Math.ceil(basePaddingX * scaleX);
              const finalPaddingY = Math.ceil(basePaddingY * scaleY);
              
              return `px-${Math.min(finalPaddingX, 5)} py-${Math.min(finalPaddingY, 3)} md:px-${Math.min(finalPaddingX + 1, 6)} md:py-${Math.min(finalPaddingY + 1, 4)}`;
            };
            
            const getTextSize = () => {
              // More granular text sizing
              if (textLength <= 6) {
                return categoryCount === 1 ? 'text-2xl md:text-4xl' : 
                       categoryCount === 2 ? 'text-xl md:text-3xl' : 'text-lg md:text-2xl';
              } else if (textLength <= 10) {
                return categoryCount === 1 ? 'text-xl md:text-3xl' : 
                       categoryCount === 2 ? 'text-lg md:text-2xl' : 'text-base md:text-xl';
              } else if (textLength <= 14) {
                return categoryCount === 1 ? 'text-lg md:text-2xl' : 
                       categoryCount === 2 ? 'text-base md:text-xl' : 'text-sm md:text-lg';
              } else if (textLength <= 18) {
                return categoryCount === 1 ? 'text-base md:text-xl' : 
                       categoryCount === 2 ? 'text-sm md:text-lg' : 'text-xs md:text-base';
              } else {
                return categoryCount === 1 ? 'text-sm md:text-lg' : 
                       categoryCount === 2 ? 'text-xs md:text-base' : 'text-xs md:text-sm';
              }
            };
            
            return (
              <Link
                key={category.id}
                href={`/${locale}/products?category=${encodeURIComponent(category.name.toLowerCase().replace(/\s+/g, '-'))}`}
                className={`
                  group relative ${getAspectRatio()} rounded-2xl overflow-hidden bg-muted 
                  hover:scale-[1.02] transition-all duration-500 ease-out shadow-lg hover:shadow-2xl
                  ring-1 ring-border/50 hover:ring-primary/30 hover:ring-2
                  transform-gpu will-change-transform
                  ${categoryCount === 1 ? 'max-w-sm' : ''}
                  ${categoryCount === 2 ? 'max-w-xs' : ''}
                `}
              >
                <Image
                  src={category.image || 'https://placehold.co/400x400/E5E7EB/9CA3AF?text=No+Image'}
                  alt={categoryName}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out transform-gpu"
                  sizes={`
                    ${categoryCount === 1 ? '(max-width: 768px) 100vw, 400px' : ''}
                    ${categoryCount === 2 ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px' : ''}
                    ${categoryCount === 3 ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw' : ''}
                    ${categoryCount === 4 ? '(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw' : ''}
                    ${categoryCount >= 5 ? '(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw' : ''}
                  `}
                  data-ai-hint={`Category: ${category.name}`}
                  priority={index < 3}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/70 group-hover:via-black/30 transition-all duration-300" />
                
                {/* Category title with optimized dynamic positioning */}
                 <div className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ease-out ${getContainerPadding()}`}>
                   <div className={`
                     bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 
                     transition-all duration-500 ease-out transform-gpu
                     hover:bg-white/20 hover:border-white/30 hover:backdrop-blur-md
                     group-hover:scale-105 group-hover:shadow-lg
                     ${getInnerPadding()}
                   `}>
                     <h3 className={`
                       text-white font-semibold text-center leading-tight 
                       transition-all duration-500 ease-out transform-gpu
                       drop-shadow-lg group-hover:text-primary-foreground
                       group-hover:drop-shadow-2xl
                       ${getTextSize()}
                     `}>
                       {categoryName}
                     </h3>
                   </div>
                 </div>
                
                {/* Enhanced hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/10 group-hover:to-primary/5 transition-all duration-700 ease-out" />
                
                {/* Subtle glow effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out">
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent blur-sm" />
                </div>
              </Link>
            );
          })}
        </div>
        
        {/* View all categories button */}
        {categories.length > 5 && (
          <div className="text-center mt-10">
            <Button variant="outline" size="lg" asChild className="group">
              <Link href={`/${locale}/products`}>
                {dictionary?.homepage?.viewAllCategories || 'View All Categories'} 
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold tracking-tight mb-4">
            {dictionary?.homepage?.featuredTitle || 'Featured Products'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {dictionary?.homepage?.featuredSubtitle || 'Discover our most popular handcrafted candles.'}
          </p>
        </div>
        
        <ProductList 
          products={featuredProducts} 
          locale={locale}
          dictionary={productCardStrings}
        />
        
        <div className="text-center mt-8">
          <Button variant="outline" size="lg" asChild>
            <Link href={`/${locale}/products`}>
              {dictionary?.homepage?.viewAllProducts || 'View All Products'} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}