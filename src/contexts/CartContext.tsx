
"use client";

import type { CartItem, Product } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'next/navigation';
import type { Locale } from '@/lib/i1n-config';
import { getDictionary } from '@/lib/getDictionary';

// Dictionary state for translations
let currentDictionary: any = null;
let currentLocale: string = 'uz';

// Function to get translations with fallback
function getTranslation(key: string, replacements?: Record<string, string>) {
  const fallbackMessages: Record<string, string> = {
    'errorTitle': 'Error',
    'infoTitle': 'Info', 
    'genericError': 'An error occurred',
    'productOutOfStockToast': '{productName} is out of stock',
    'stockAvailableToast': 'Only {availableStock} items available',
    'addedToCartLimitedStockToast': 'Added {availableStock} items (maximum available)'
  };
  
  let message = currentDictionary?.cartContextToasts?.[key] || fallbackMessages[key] || key;
  
  // Replace placeholders if provided
  if (replacements) {
    Object.entries(replacements).forEach(([placeholder, value]) => {
      message = message.replace(`{${placeholder}}`, value);
    });
  }
  
  return message;
}


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
  const locale = (params?.locale as Locale) || 'uz';

  // Load dictionary when locale changes
  useEffect(() => {
    const loadDictionary = async () => {
      if (locale !== currentLocale) {
        try {
          currentDictionary = await getDictionary(locale);
          currentLocale = locale;
        } catch (error) {
        // Handle dictionary loading error silently in production
        }
      }
    };
    loadDictionary();
  }, [locale]);

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
      // Handle localStorage parsing error silently in production
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
       // Handle invalid product data silently in production
       return;
    }
    
    if (product.stock <= 0 && !cartItems.find(item => item.id === product.id)) {
      toast({
        title: getTranslation('errorTitle'),
        description: getTranslation('productOutOfStockToast', { productName }),
        variant: "destructive",
      });
      return;
    }

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      let finalQuantity: number;

      if (existingItem) {
        const potentialQuantity = existingItem.quantity + quantityToAdd;
        if (potentialQuantity > product.stock) {
          finalQuantity = product.stock;
          toast({
            title: getTranslation('infoTitle'),
            description: getTranslation('stockAvailableToast', { availableStock: String(product.stock) }),
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
            title: getTranslation('infoTitle'),
            description: getTranslation('addedToCartLimitedStockToast', { availableStock: String(product.stock) }),
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
        title: getTranslation('infoTitle'),
        description: getTranslation('stockAvailableToast', { availableStock: String(itemInCart.stock) }),
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

    