import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from '@/providers/AuthProvider';
import type { Order, Table, SocketNotification } from '@/constants/types';

const SOCKET_URL = 'wss://api.tonalli.app/staff';

export const [SocketProvider, useSocket] = createContextHook(() => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<SocketNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const addNotification = useCallback((notif: SocketNotification) => {
    setNotifications(prev => [notif, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    console.log('[Socket] Notification:', notif.type, notif.message);
  }, []);

  const clearNotifications = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const dismissNotification = useCallback((index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        console.log('[Socket] Disconnecting (not authenticated)');
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const getToken = async () => {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      return AsyncStorage.getItem('tonalli_access_token');
    };

    getToken().then(token => {
      if (!token) return;

      console.log('[Socket] Connecting to', SOCKET_URL);
      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      socket.on('connect', () => {
        console.log('[Socket] Connected');
        setIsConnected(true);
      });

      socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
        setIsConnected(false);
      });

      socket.on('connect_error', (err) => {
        console.log('[Socket] Connection error:', err.message);
      });

      socket.on('order:new', (order: Order) => {
        console.log('[Socket] New order:', order.orderNumber);
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        addNotification({
          type: 'order_new',
          title: 'Nuevo Pedido',
          message: `Pedido #${String(order.orderNumber).padStart(3, '0')} - Mesa ${order.table.number}`,
          tableNumber: order.table.number,
          orderId: order.id,
          timestamp: new Date().toISOString(),
        });
      });

      socket.on('order:updated', (order: Order) => {
        console.log('[Socket] Order updated:', order.orderNumber, order.status);
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      });

      socket.on('order:item:updated', (data: { orderId: string; item: unknown }) => {
        console.log('[Socket] Order item updated:', data.orderId);
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      });

      socket.on('table:updated', (_table: Table) => {
        console.log('[Socket] Table updated');
        queryClient.invalidateQueries({ queryKey: ['tables'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      });

      socket.on('table:bill-requested', (data: { tableNumber: number; tableId: string; timestamp: string }) => {
        console.log('[Socket] Bill requested for table:', data.tableNumber);
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['tables'] });
        addNotification({
          type: 'bill_requested',
          title: 'Cuenta Solicitada',
          message: `Mesa ${data.tableNumber} solicita la cuenta`,
          tableNumber: data.tableNumber,
          timestamp: data.timestamp,
        });
      });

      socket.on('table:waiter-called', (data: { tableNumber: number; tableId: string; reason?: string; timestamp: string }) => {
        console.log('[Socket] Waiter called for table:', data.tableNumber);
        addNotification({
          type: 'waiter_called',
          title: 'Mesero Solicitado',
          message: `Mesa ${data.tableNumber}${data.reason ? ': ' + data.reason : ''}`,
          tableNumber: data.tableNumber,
          timestamp: data.timestamp,
        });
      });

      socketRef.current = socket;
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, user, queryClient, addNotification]);

  return {
    isConnected,
    notifications,
    unreadCount,
    clearNotifications,
    dismissNotification,
  };
});
