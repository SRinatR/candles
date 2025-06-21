
"use client";

import type { Product } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from "@/hooks/use-toast";
import type { Locale } from '@/lib/i1n-config';

export interface ProductCardDictionary {
  addToCart: string;
  addedToCartTitle: string;
  addedToCartDesc: string; // Expects a string with {productName} placeholder
  outOfStock?: string;
}

const defaultProductCardDictionary: ProductCardDictionary = {
  addToCart: "Add to Cart",
  addedToCartTitle: "Added to cart",
  addedToCartDesc: "{productName} has been added.",
  outOfStock: "Out of Stock"
};

interface ProductCardProps {
  product: Product;
  locale: Locale;
  dictionary: ProductCardDictionary;
}

export function ProductCard({ product, locale, dictionary }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Use provided dictionary or fallback to default
  const currentDictionary = dictionary || defaultProductCardDictionary;
  
  // Enhanced fallback logic to handle empty objects and missing translations
  const getLocalizedText = (textObj: any, fallbackText: string = "") => {
    if (!textObj || typeof textObj !== 'object') return fallbackText;
    return textObj[locale] || textObj.en || textObj.uz || fallbackText;
  };
  
  const productName = getLocalizedText(product.name, "Product Name Not Available");
  const productDescription = getLocalizedText(product.description, "");


  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast({
      title: currentDictionary.addedToCartTitle,
      description: currentDictionary.addedToCartDesc.replace('{productName}', productName),
    });
  };

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col rounded-lg border border-border/60">
      <Link href={`/${locale}/products/${product.id}`} className="block group h-full flex flex-col">
        <CardHeader className="p-0">
          <div className="overflow-hidden relative">
            {(() => {
              // Determine the image source with proper validation
              let imageSrc = '';
              
              if (product.mainImage && typeof product.mainImage === 'string' && product.mainImage.trim() !== '') {
                imageSrc = product.mainImage;
              } else if (product.images && product.images.length > 0 && product.images[0] && typeof product.images[0] === 'string' && product.images[0].trim() !== '') {
                imageSrc = product.images[0];
              }
              
              return imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={productName}
                  width={400}
                  height={400}
                  className="object-cover w-full h-auto group-hover:scale-105 transition-transform duration-300"
                  data-ai-hint={`${product.category?.name || 'product'} product`}
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-[400px] bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg">
                          <svg class="w-16 h-16 text-muted-foreground/40 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <span class="text-muted-foreground text-sm font-medium">Image Not Available</span>
                          <span class="text-muted-foreground/60 text-xs mt-1">${productName}</span>
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-[400px] bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg">
                  <svg className="w-16 h-16 text-muted-foreground/40 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span className="text-muted-foreground text-sm font-medium">Image Not Available</span>
                  <span className="text-muted-foreground/60 text-xs mt-1">{productName}</span>
                </div>
              );
            })()}
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow flex flex-col"> {/* Modified: Added flex flex-col */}
          <div> {/* Wrapper for title and description */}
            <CardTitle className="text-lg font-semibold leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2"> {/* Added line-clamp-2 */}
              {productName}
            </CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{productDescription}</p>
          </div>
          <p className="text-lg font-bold text-foreground mt-auto pt-2"> {/* Modified: Added mt-auto and pt-2 */}
            {product.price.toLocaleString('en-US')} UZS
          </p>
        </CardContent>
        <CardFooter className="p-4 border-t border-border/60">
          <Button
            variant="outline"
            className="w-full hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={handleAddToCart}
            aria-label={`${currentDictionary.addToCart} ${productName}`}
            disabled={product.stock === 0 || !product.isActive}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {product.stock === 0 || !product.isActive ? (currentDictionary.outOfStock || "Out of Stock") : currentDictionary.addToCart}
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
}
