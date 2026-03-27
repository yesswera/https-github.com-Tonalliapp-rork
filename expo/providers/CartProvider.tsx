import { useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import * as Haptics from 'expo-haptics';
import type { Product, CartItem } from '@/constants/types';

export const [CartProvider, useCart] = createContextHook(() => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderNotes, setOrderNotes] = useState<string>('');

  const addItem = useCallback((product: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1, notes: '' }];
    });
    console.log('[Cart] Added:', product.name);
  }, []);

  const removeItem = useCallback((productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems(prev => {
      const existing = prev.find(i => i.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(i =>
          i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter(i => i.product.id !== productId);
    });
  }, []);

  const updateItemNotes = useCallback((productId: string, notes: string) => {
    setItems(prev =>
      prev.map(i => (i.product.id === productId ? { ...i, notes } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setOrderNotes('');
  }, []);

  const getQuantity = useCallback(
    (productId: string) => {
      return items.find(i => i.product.id === productId)?.quantity ?? 0;
    },
    [items]
  );

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + parseFloat(i.product.price) * i.quantity, 0),
    [items]
  );

  return {
    items,
    orderNotes,
    setOrderNotes,
    addItem,
    removeItem,
    updateItemNotes,
    clearCart,
    getQuantity,
    totalItems,
    totalPrice,
  };
});
