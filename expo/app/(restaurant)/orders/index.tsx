import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import StatusBadge, { getStatusColor } from '@/components/StatusBadge';
import { apiFetch } from '@/utils/api';
import type { Order, OrderStatus } from '@/constants/types';

const TABS: { key: string; label: string; status?: string }[] = [
  { key: 'pending', label: 'Pendientes', status: 'pending' },
  { key: 'preparing', label: 'Preparando', status: 'preparing' },
  { key: 'ready', label: 'Listos', status: 'ready' },
  { key: 'all', label: 'Todos' },
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
  delivered: 'paid',
};

const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: 'Confirmar',
  confirmed: 'Preparar',
  preparing: 'Listo',
  ready: 'Entregar',
  delivered: 'Cobrar',
};

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

export default function OrdersScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const numColumns = isTablet ? 2 : 1;

  const statusParam = TABS.find(t => t.key === activeTab)?.status;
  const queryStr = statusParam ? `?status=${statusParam}&limit=50` : '?limit=50';

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['orders', activeTab],
    queryFn: () => apiFetch<OrdersResponse>(`/orders${queryStr}`, { auth: true }),
    refetchInterval: 10000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      return apiFetch(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status },
        auth: true,
      });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiFetch(`/orders/${orderId}/cancel`, {
        method: 'POST',
        body: { reason: 'Cancelado por staff' },
        auth: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const getTimeAgo = useCallback((createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }, []);

  const handleAdvance = useCallback((order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    updateStatusMutation.mutate({ orderId: order.id, status: next });
  }, [updateStatusMutation]);

  const handleCancel = useCallback((order: Order) => {
    Alert.alert(
      'Cancelar pedido',
      `¿Cancelar pedido #${order.orderNumber}?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancelMutation.mutate(order.id) },
      ]
    );
  }, [cancelMutation]);

  const renderOrder = useCallback(
    ({ item }: { item: Order }) => {
      const borderColor = getStatusColor(item.status);
      const nextLabel = NEXT_STATUS_LABEL[item.status];

      return (
        <View style={[styles.orderCard, { borderLeftColor: borderColor }, isTablet && styles.orderCardTablet]}>
          <View style={styles.orderHeader}>
            <View style={styles.orderHeaderLeft}>
              <Text style={styles.orderNumber}>#{String(item.orderNumber).padStart(3, '0')}</Text>
              <View style={styles.tableBadge}>
                <Text style={styles.tableText}>Mesa {item.table.number}</Text>
              </View>
            </View>
            <View style={styles.orderHeaderRight}>
              <View style={styles.timeRow}>
                <Clock size={12} color={Colors.silverDark} />
                <Text style={styles.timeText}>{getTimeAgo(item.createdAt)}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
          </View>

          <View style={styles.itemsList}>
            {item.items.slice(0, 4).map(orderItem => (
              <View key={orderItem.id} style={styles.orderItemRow}>
                <Text style={styles.orderItemQty}>{orderItem.quantity}x</Text>
                <Text style={styles.orderItemName} numberOfLines={1}>{orderItem.product.name}</Text>
                {orderItem.notes ? (
                  <Text style={styles.orderItemNote} numberOfLines={1}>({orderItem.notes})</Text>
                ) : null}
              </View>
            ))}
            {item.items.length > 4 && (
              <Text style={styles.moreItems}>+{item.items.length - 4} más</Text>
            )}
          </View>

          {item.notes ? (
            <View style={styles.notesRow}>
              <Text style={styles.notesText}>📝 {item.notes}</Text>
            </View>
          ) : null}

          <View style={styles.orderFooter}>
            <Text style={styles.orderTotal}>${parseFloat(item.total).toFixed(2)}</Text>
            <View style={styles.orderActions}>
              {item.status !== 'paid' && item.status !== 'cancelled' && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => handleCancel(item)}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
              )}
              {nextLabel && (
                <TouchableOpacity
                  style={styles.advanceBtn}
                  onPress={() => handleAdvance(item)}
                >
                  <Text style={styles.advanceBtnText}>{nextLabel}</Text>
                  <ChevronRight size={14} color={Colors.black} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    },
    [getTimeAgo, handleAdvance, handleCancel, isTablet]
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={[styles.screenHeader, isTablet && styles.screenHeaderTablet]}>
          <Text style={styles.screenTitle}>Pedidos</Text>
          {data && <Text style={styles.screenCount}>{data.total} total</Text>}
        </View>

        <View style={[styles.tabBar, isTablet && styles.tabBarTablet]}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.gold} size="large" />
          </View>
        ) : (
          <FlatList
            key={`orders-${numColumns}`}
            data={data?.orders ?? []}
            renderItem={renderOrder}
            keyExtractor={item => item.id}
            numColumns={numColumns}
            contentContainerStyle={[styles.list, isTablet && styles.listTablet]}
            columnWrapperStyle={isTablet ? styles.columnWrapper : undefined}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.gold} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyText}>Sin pedidos en esta categoría</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  safe: {
    flex: 1,
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  screenHeaderTablet: {
    paddingHorizontal: 32,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '300' as const,
    color: Colors.white,
    letterSpacing: 1,
  },
  screenCount: {
    color: Colors.silverMuted,
    fontSize: 13,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 6,
  },
  tabBarTablet: {
    paddingHorizontal: 28,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.blackCard,
  },
  tabActive: {
    backgroundColor: Colors.gold,
  },
  tabText: {
    color: Colors.silverDark,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  tabTextActive: {
    color: Colors.black,
    fontWeight: '600' as const,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  listTablet: {
    paddingHorizontal: 28,
  },
  columnWrapper: {
    gap: 12,
  },
  orderCard: {
    flex: 1,
    backgroundColor: Colors.blackCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  orderCardTablet: {
    maxWidth: '50%',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumber: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '600' as const,
  },
  tableBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.tableBorderJade,
    backgroundColor: Colors.tableBgJade,
  },
  tableText: {
    color: Colors.jadeLight,
    fontSize: 10,
    fontWeight: '500' as const,
  },
  orderHeaderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: Colors.silverDark,
    fontSize: 11,
  },
  itemsList: {
    gap: 4,
    marginBottom: 10,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderItemQty: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '600' as const,
    minWidth: 22,
  },
  orderItemName: {
    color: Colors.silver,
    fontSize: 13,
    flex: 1,
  },
  orderItemNote: {
    color: Colors.silverDark,
    fontSize: 11,
    fontStyle: 'italic' as const,
    maxWidth: 120,
  },
  moreItems: {
    color: Colors.silverMuted,
    fontSize: 11,
    marginTop: 2,
  },
  notesRow: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: Colors.blackSoft,
    borderRadius: 8,
    marginBottom: 10,
  },
  notesText: {
    color: Colors.silverMuted,
    fontSize: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 10,
  },
  orderTotal: {
    color: Colors.gold,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 62, 62, 0.3)',
  },
  cancelBtnText: {
    color: Colors.red,
    fontSize: 12,
    fontWeight: '500' as const,
  },
  advanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.gold,
  },
  advanceBtnText: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    color: Colors.silverMuted,
    fontSize: 14,
  },
});
