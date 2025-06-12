
import type { Product } from '@/lib/types';
import { ProductCard } from './ProductCard';
import type { Locale } from '@/lib/i1n-config'; // Added locale

interface ProductListProps {
  products: Product[];
  locale: Locale; // Added locale
}

export function ProductList({ products, locale }: ProductListProps) {
  if (!products || products.length === 0) {
    // TODO: Translate this message
    return <p className="text-center text-muted-foreground">No products found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} locale={locale} />
      ))}
    </div>
  );
}
