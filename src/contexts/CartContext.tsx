
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/types/product';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Генерация ID сессии для анонимных пользователей
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('cart-session-id');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    sessionStorage.setItem('cart-session-id', sessionId);
  }
  return sessionId;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Загрузка корзины с сервера
  const loadCart = async () => {
    if (typeof window === 'undefined') return;
    
    setIsLoading(true);
    try {
      const sessionId = getSessionId();
      const response = await apiClient.getCart({ sessionId });
      
      if (response.data) {
        setItems(response.data.items || []);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  };

  // Загрузка корзины при монтировании
  useEffect(() => {
    loadCart();
  }, []);

  const addItem = async (product: Product, quantity: number = 1) => {
    if (!product) {
      console.error("Product is undefined or null");
      return;
    }

    if (product.stock <= 0) {
      toast({
        title: "Ошибка",
        description: `${product.name || 'Товар'} отсутствует на складе.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const sessionId = getSessionId();
      const response = await apiClient.addToCart({
        productId: product.id,
        quantity,
        sessionId
      });

      if (response.error) {
        toast({
          title: "Ошибка",
          description: response.error,
          variant: "destructive",
        });
      } else {
        // Перезагрузить корзину после добавления
        await loadCart();
        toast({
          title: "Успешно",
          description: `${product.name || 'Товар'} добавлен в корзину.`,
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить товар в корзину.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (productId: string) => {
    const item = items.find(item => item.product.id === productId);
    if (!item) return;

    setIsLoading(true);
    try {
      const response = await apiClient.removeFromCart(item.id);
      
      if (response.error) {
        toast({
          title: "Ошибка",
          description: response.error,
          variant: "destructive",
        });
      } else {
        await loadCart();
        toast({
          title: "Успешно",
          description: "Товар удален из корзины.",
        });
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить товар из корзины.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    const item = items.find(item => item.product.id === productId);
    if (!item) return;

    if (newQuantity <= 0) {
      await removeItem(productId);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.updateCartItem(item.id, newQuantity);
      
      if (response.error) {
        toast({
          title: "Ошибка",
          description: response.error,
          variant: "destructive",
        });
      } else {
        await loadCart();
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить количество.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      const sessionId = getSessionId();
      const response = await apiClient.clearCart({ sessionId });
      
      if (response.error) {
        toast({
          title: "Ошибка",
          description: response.error,
          variant: "destructive",
        });
      } else {
        setItems([]);
        toast({
          title: "Успешно",
          description: "Корзина очищена.",
        });
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось очистить корзину.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalItems = () => items.reduce((total, item) => total + item.quantity, 0);
  const getTotalPrice = () => items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const isInCart = (productId: string) => items.some(item => item.product.id === productId);
  const getItemQuantity = (productId: string) => {
    const item = items.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      isInCart,
      getItemQuantity,
      isLoading
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

    
