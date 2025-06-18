"use client";

import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';

interface AddToCartButtonProps {
  product: Product;
  className?: string;
  children?: React.ReactNode;
}

export function AddToCartButton({ product, className, children }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    if (product.stock <= 0) {
      toast({
        title: "Out of Stock",
        description: "This product is currently out of stock.",
        variant: "destructive",
      });
      return;
    }

    addToCart(product);
    toast({
      title: "Added to Cart",
      description: `${product.name.en || product.name.uz} has been added to your cart.`,
    });
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={product.stock <= 0}
      className={className}
    >
      {children || (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </>
      )}
    </Button>
  );
}