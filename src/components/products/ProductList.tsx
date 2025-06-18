
import type { Product } from '@/lib/types';
import { ProductCard, type ProductCardDictionary } from './ProductCard';
import type { Locale } from '@/lib/i1n-config'; // Added locale

interface ProductListProps {
  products: Product[];
  locale: Locale; // Added locale
  dictionary: ProductCardDictionary;
}

export function ProductList({ products, locale, dictionary }: ProductListProps) {
  if (!products || products.length === 0) {
    // TODO: Translate this message
    return <p className="text-center text-muted-foreground">No products found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} locale={locale} dictionary={dictionary} />
      ))}
    </div>
  );
}
