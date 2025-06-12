
"use client";

import type { CartItem, Product } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'next/navigation';
import type { Locale } from '@/lib/i1n-config';

// Simulating dictionary loading for client component
import enMessages from '@/dictionaries/en.json';
import ruMessages from '@/dictionaries/ru.json';
import uzMessages from '@/dictionaries/uz.json';

type FullDictionary = typeof enMessages;
type CartContextToastsDictionary = FullDictionary['cartContextToasts'];

const dictionaries: Record<Locale, FullDictionary> = {
  en: enMessages,
  ru: ruMessages,
  uz: uzMessages,
};

// Fallback dictionary for toasts if primary loading fails or keys are missing
const fallbackCartContextToasts: CartContextToastsDictionary = {
  errorTitle: "Error",
  infoTitle: "Info",
  productOutOfStockToast: "{productName} is out of stock.",
  stockAvailableToast: "Not enough stock. Quantity updated to {availableStock}.",
  addedToCartLimitedStockToast: "Not enough stock. Added {availableStock} to cart.",
  genericError: "An unexpected error occurred."
};

const getCartContextToastsDictionary = (locale: Locale): CartContextToastsDictionary => {
  const mainDict = dictionaries[locale] || dictionaries.en;
  return mainDict?.cartContextToasts || fallbackCartContextToasts;
};


interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'askimCart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const params = useParams();
  const locale = (params.locale as Locale) || 'uz';
  const dictionary = getCartContextToastsDictionary(locale);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        try {
          const parsedCart = JSON.parse(storedCart);
          if (Array.isArray(parsedCart)) {
            return parsedCart;
          }
        } catch (error) {
          console.error("Failed to parse cart from localStorage on init:", error);
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const addToCart = (product: Product, quantityToAdd: number = 1) => {
    const productName = product.name[locale] || product.name.en;
    if (!product || product.stock === undefined) {
      console.error("Product data is invalid or stock is undefined", product);
      toast({
        title: dictionary.errorTitle,
        description: dictionary.genericError,
        variant: "destructive",
      });
      return;
    }
    
    if (product.stock <= 0 && !cartItems.find(item => item.id === product.id)) {
      toast({
        title: dictionary.errorTitle,
        description: (dictionary.productOutOfStockToast || fallbackCartContextToasts.productOutOfStockToast).replace('{productName}', productName),
        variant: "destructive",
      });
      return;
    }

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      let finalQuantity;

      if (existingItem) {
        const potentialQuantity = existingItem.quantity + quantityToAdd;
        if (potentialQuantity > product.stock) {
          finalQuantity = product.stock;
          toast({
            title: dictionary.infoTitle,
            description: (dictionary.stockAvailableToast || fallbackCartContextToasts.stockAvailableToast).replace('{availableStock}', String(product.stock)),
          });
        } else {
          finalQuantity = potentialQuantity;
        }
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.max(0, finalQuantity) } 
            : item
        );
      } else {
        if (quantityToAdd > product.stock) {
          finalQuantity = product.stock;
          toast({
            title: dictionary.infoTitle,
            description: (dictionary.addedToCartLimitedStockToast || fallbackCartContextToasts.addedToCartLimitedStockToast).replace('{availableStock}', String(product.stock)),
          });
        } else {
          finalQuantity = quantityToAdd;
        }
         if (finalQuantity <= 0) return prevItems; // Don't add if resulting quantity is 0 or less
        return [...prevItems, { ...product, quantity: Math.max(1, finalQuantity) }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const itemInCart = cartItems.find(item => item.id === productId);
    if (!itemInCart) return;
    const productName = itemInCart.name[locale] || itemInCart.name.en;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    let finalQuantity = newQuantity;
    if (newQuantity > itemInCart.stock) {
      finalQuantity = itemInCart.stock;
      toast({
        title: dictionary.infoTitle,
        description: (dictionary.stockAvailableToast || fallbackCartContextToasts.stockAvailableToast).replace('{availableStock}', String(itemInCart.stock)),
      });
    }
    
    if (finalQuantity === 0) { // If stock is 0, and user tries to update to 0 (or it was capped to 0)
        removeFromCart(productId);
        return;
    }


    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity: finalQuantity } : item
      ).filter(item => item.quantity > 0) // Ensure items with 0 quantity are removed
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

    