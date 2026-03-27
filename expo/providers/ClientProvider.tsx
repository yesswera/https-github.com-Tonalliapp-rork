import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import type { Restaurant, Table } from '@/constants/types';

interface ClientState {
  restaurant: Restaurant | null;
  table: Table | null;
  slug: string;
  tableNumber: number;
  activeOrderId: string | null;
}

export const [ClientProvider, useClient] = createContextHook(() => {
  const [state, setState] = useState<ClientState>({
    restaurant: null,
    table: null,
    slug: '',
    tableNumber: 0,
    activeOrderId: null,
  });

  const setRestaurantInfo = useCallback((restaurant: Restaurant, table: Table, slug: string) => {
    setState(prev => ({
      ...prev,
      restaurant,
      table,
      slug,
      tableNumber: table.number,
    }));
    console.log('[Client] Restaurant info set:', restaurant.name, 'Table:', table.number);
  }, []);

  const setActiveOrder = useCallback(async (orderId: string) => {
    setState(prev => ({ ...prev, activeOrderId: orderId }));
    try {
      await AsyncStorage.setItem('tonalli_active_order', orderId);
    } catch (e) {
      console.log('[Client] Error saving order ID:', e);
    }
  }, []);

  const loadActiveOrder = useCallback(async () => {
    try {
      const orderId = await AsyncStorage.getItem('tonalli_active_order');
      if (orderId) {
        setState(prev => ({ ...prev, activeOrderId: orderId }));
      }
      return orderId;
    } catch (e) {
      console.log('[Client] Error loading order ID:', e);
      return null;
    }
  }, []);

  const clearActiveOrder = useCallback(async () => {
    setState(prev => ({ ...prev, activeOrderId: null }));
    try {
      await AsyncStorage.removeItem('tonalli_active_order');
    } catch (e) {
      console.log('[Client] Error clearing order ID:', e);
    }
  }, []);

  return {
    ...state,
    setRestaurantInfo,
    setActiveOrder,
    loadActiveOrder,
    clearActiveOrder,
  };
});
