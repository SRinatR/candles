
"use client";

// import { mockProducts, mockCategories } from '@/lib/mock-data';
import { notFound, useParams } from 'next/navigation';
import { ProductImageGallery } from '@/components/products/ProductImageGallery';
import { ProductDetailSkeleton } from '@/components/products/ProductDetailSkeleton';
import { AddToCartButton } from '@/components/products/AddToCartButton';
import { ProductList } from '@/components/products/ProductList';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Zap, ShieldCheck, Package, Clock, Tag, Palette, Droplets, Ruler, Info } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Slash } from 'lucide-react';
import type { Locale } from '@/lib/i1n-config';
import { ProductCard, type ProductCardDictionary } from '@/components/products/ProductCard';
import { useState, useEffect, use } from 'react';


import enMessages from '@/dictionaries/en.json';
import ruMessages from '@/dictionaries/ru.json';
import uzMessages from '@/dictionaries/uz.json';

type Dictionary = typeof enMessages;
type ProductDetailPageStrings = Dictionary['productDetailPage'];
type CategoriesStrings = Dictionary['categories'];
type ProductCardStrings = Dictionary['productCard'];


const dictionaries: Record<Locale, Dictionary> = {
  en: enMessages,
  ru: ruMessages,
  uz: uzMessages,
};

const getProductDetailPageDictionaryBundle = (locale: Locale) => {
  const dict = dictionaries[locale] || dictionaries.en;
  return {
    page: dict.productDetailPage || { 
      home: "Home",
      products: "Products",
      skuLabel: "SKU:",
      onlyLeftInStock: "Only {stock} left in stock!",
      outOfStock: "Out of Stock",
      categoryLabel: "Category:",
      scentLabel: "Scent:",
      materialLabel: "Material:",
      dimensionsLabel: "Dimensions:",
      burningTimeLabel: "Burning Time:",
      attributesLabel: "Other Attributes:",
      outOfStockButton: "Out of Stock",
      fastDispatch: "Fast Dispatch",
      secureCheckout: "Secure Checkout",
      easyReturns: "Easy Returns",
      relatedProductsTitle: "You Might Also Like"
    },
    productCard: dict.productCard || { 
      addToCart: "Add to Cart (Detail Page Fallback)",
      addedToCartTitle: "Added to cart (Detail Page Fallback)",
      addedToCartDesc: "{productName} has been added (Detail Page Fallback).",
      outOfStock: "Out of Stock (Detail Page Fallback)"
    },
     categories: dict.categories || {}
  };
};

export default function ProductDetailPage({ params }: { params: Promise<{ id: string; locale: Locale }> }) {
  const routeParams = use(params);
  const clientParams = useParams();
  const locale = routeParams.locale || clientParams.locale as Locale || 'uz';
  
  const dictionaryBundle = getProductDetailPageDictionaryBundle(locale);
  const dictionary = dictionaryBundle.page;
  const productCardDict = dictionaryBundle.productCard as ProductCardDictionary;
  const categoriesDict = dictionaryBundle.categories as CategoriesStrings;

  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productRes = await fetch(`/api/products/${routeParams.id}?locale=${locale}`);
        
        if (productRes.ok) {
          const productData = await productRes.json();
          setProduct(productData);
          
          // Fetch related products
          try {
            const relatedRes = await fetch(`/api/products?category=${productData.category?.slug || productData.category?.name}&exclude=${productData.id}&limit=3&locale=${locale}`);
            if (relatedRes.ok) {
              const relatedData = await relatedRes.json();
              setRelatedProducts(relatedData.products || []);
            }
          } catch (relatedError) {
            console.error('Error loading related products:', relatedError);
          }
        } else if (productRes.status === 404) {
          setError('Product not found');
        } else {
          setError('Failed to load product');
        }
      } catch (error) {
        console.error('Error loading product:', error);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [routeParams.id, locale]);

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    notFound();
  }

  const productName = product.translations?.[locale]?.name || product.translations?.en?.name || 'Product Name';
  const productDescription = product.translations?.[locale]?.description || product.translations?.en?.description || 'Product Description';

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: productCardDict.addedToCartTitle,
      description: productCardDict.addedToCartDesc.replace('{productName}', productName),
    });
  };

  // Related products are now loaded via API in useEffect
  const productCategorySlug = product.category?.slug || product.category?.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown';
  const productCategoryName = categoriesDict[productCategorySlug as keyof typeof categoriesDict] || product.category?.name || 'Unknown Category';


  return (
    <div className="space-y-10">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${locale}/`}>{dictionary.home}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator><Slash /></BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${locale}/products`}>{dictionary.products}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator><Slash /></BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>{productName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        <ProductImageGallery images={product.images?.map(img => img.url) || []} altText={productName} />

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{productName}</h1>
            <p className="text-2xl font-semibold text-primary">{product.price.toLocaleString('en-US')} UZS</p>
            {product.stock > 0 && product.stock <= 5 && (
              <Badge variant="destructive" className="text-xs">{dictionary.onlyLeftInStock.replace('{stock}', String(product.stock))}</Badge>
            )}
            {product.stock === 0 && (
              <Badge variant="outline" className="text-xs">{dictionary.outOfStock}</Badge>
            )}
             {!product.isActive && (
              <Badge variant="destructive" className="text-sm ml-2">Currently Unavailable</Badge>
            )}
          </div>

          <p className="text-base text-muted-foreground leading-relaxed">{productDescription}</p>

          <Separator />

          <div className="space-y-3 text-sm">
            {product.sku && <p className="flex items-center"><Info className="mr-2 h-4 w-4 text-muted-foreground"/> <strong className="font-medium">{dictionary.skuLabel}</strong> <span className="ml-1">{product.sku}</span></p>}
            {product.category && <p className="flex items-center"><Tag className="mr-2 h-4 w-4 text-muted-foreground"/> <strong className="font-medium">{dictionary.categoryLabel}</strong> <Link href={`/${locale}/products?category=${productCategorySlug}`} className="text-primary hover:underline ml-1">{productCategoryName}</Link></p>}
            {product.scent && <p className="flex items-center"><Droplets className="mr-2 h-4 w-4 text-muted-foreground"/> <strong className="font-medium">{dictionary.scentLabel}</strong> <span className="ml-1">{product.scent?.name || product.scent}</span></p>}
            {product.material && <p className="flex items-center"><Palette className="mr-2 h-4 w-4 text-muted-foreground"/> <strong className="font-medium">{dictionary.materialLabel}</strong> <span className="ml-1">{product.material?.name || product.material}</span></p>}
            {product.dimensions && <p className="flex items-center"><Ruler className="mr-2 h-4 w-4 text-muted-foreground"/> <strong className="font-medium">{dictionary.dimensionsLabel}</strong> <span className="ml-1">{product.dimensions}</span></p>}
            {product.burningTime && <p className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground"/> <strong className="font-medium">{dictionary.burningTimeLabel}</strong> <span className="ml-1">{product.burningTime}</span></p>}
            
            {product.attributes && product.attributes.length > 0 && (
                <div className="pt-2">
                    <h4 className="font-medium mb-1">{dictionary.attributesLabel}</h4>
                    <ul className="list-disc list-inside space-y-1 pl-1">
                        {product.attributes.map((attr: { key: string; value: string }) => (
                        <li key={attr.key}><strong className="font-normal">{attr.key}:</strong> {attr.value}</li>
                        ))}
                    </ul>
                </div>
            )}
          </div>

          <Button
            size="lg"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg transition-all transform hover:scale-105"
            onClick={handleAddToCart}
            disabled={product.stock === 0 || !product.isActive}
            aria-label={`${productCardDict.addToCart} ${productName}`}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {product.stock === 0 ? (dictionary.outOfStockButton || "Out of Stock") : productCardDict.addToCart}
          </Button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Zap className="h-5 w-5 text-primary" />
              <span>{dictionary.fastDispatch}</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>{dictionary.secureCheckout}</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Package className="h-5 w-5 text-primary" />
              <span>{dictionary.easyReturns}</span>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="pt-10 border-t">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">{dictionary.relatedProductsTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map(related => (
              <ProductCard
                key={related.id}
                product={related}
                locale={locale}
                dictionary={productCardDict}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
