'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type CartItem = {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
};

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (menuId: string) => void;
  updateQuantity: (menuId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isStoreOpen: boolean;
  setStoreOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isStoreOpen, setStoreOpen] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('kk-dimsum-cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        console.error('Failed to parse cart');
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('kk-dimsum-cart', JSON.stringify(items));
    }
  }, [items, isMounted]);

  const addItem = (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems(prev => {
      const existing = prev.find(i => i.menuId === newItem.menuId);
      if (existing) {
        return prev.map(i => 
          i.menuId === newItem.menuId 
            ? { ...i, quantity: i.quantity + (newItem.quantity || 1) } 
            : i
        );
      }
      return [...prev, { ...newItem, quantity: newItem.quantity || 1 }];
    });
  };

  const removeItem = (menuId: string) => {
    setItems(prev => prev.filter(i => i.menuId !== menuId));
  };

  const updateQuantity = (menuId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuId);
      return;
    }
    setItems(prev => prev.map(i => i.menuId === menuId ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, isStoreOpen, setStoreOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
