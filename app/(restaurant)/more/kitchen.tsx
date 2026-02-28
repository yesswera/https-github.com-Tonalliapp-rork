import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, Check, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { apiFetch } from '@/utils/api';
import type { Order, OrderStatus } from '@/constants/types';

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

function KitchenTimer({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(createdAt).getTime();
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(`${mins}:${String(secs).padStart(2, '0')}`);
      setIsUrgent(mins >= 15);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  useEffect(() => {
    if (isUrgent) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.6, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isUrgent, pulseAnim]);

  return (
    <Animated.View style={[styles.timerBadge, isUrgent && styles.timerUrgent, { opacity: isUrgent ? pulseAnim : 1 }]}>
      {isUrgent ? <Flame size={12} color={Colors.red} /> : <Clock size={12} color={Colors.silverMuted} />}
      <Text style={[styles.timerText, isUrgent && { color: Colors.red }]}>{elapsed}</Text>
    </Animated.View>
  );
}

export default function KitchenScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'confirmed' | 'preparing'>('confirmed');
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const numColumns = isTablet ? 2 : 1;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['kitchen-orders', activeTab],
    queryFn: () => apiFetch<OrdersResponse>(`/orders?status=${activeTab}&limit=50`, { auth: true }),
    refetchInterval: 8000,
  });

  const updateOrderStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      apiFetch(`/orders/${orderId}/status`, { method: 'PATCH', body: { status }, auth: true }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const updateItemStatus = useMutation({
    mutationFn: ({ orderId, itemId, status }: { orderId: string; itemId: string; status: string }) =>
      apiFetch(`/orders/${orderId}/items/${itemId}/status`, { method: 'PATCH', body: { status }, auth: true }),
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const handleMarkReady = useCallback((order: Order) => {
    updateOrderStatus.mutate({ orderId: order.id, status: 'ready' });
  }, [updateOrderStatus]);

  const handleStartPreparing = useCallback((order: Order) => {
    updateOrderStatus.mutate({ orderId: order.id, status: 'preparing' });
  }, [updateOrderStatus]);

  const handleItemReady = useCallback((orderId: string, itemId: string) => {
    updateItemStatus.mutate({ orderId, itemId, status: 'ready' });
  }, [updateItemStatus]);

  const renderOrder = useCallback(({ item }: { item: Order }) => {
    const isPreparing = item.status === 'preparing';
    return (
      <View style={[styles.kitchenCard, { borderLeftColor: isPreparing ? Colors.goldLight : Colors.gold }, isTablet && styles.kitchenCardTablet]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.orderNum}>#{String(item.orderNumber).padStart(3, '0')}</Text>
            <View style={styles.tableBadgeKitchen}>
              <Text style={styles.tableBadgeText}>Mesa {item.table.number}</Text>
            </View>
          </View>
          <KitchenTimer createdAt={item.createdAt} />
        </View>

        {item.notes ? (
          <View style={styles.notesBar}>
            <Text style={styles.notesBarText}>📝 {item.notes}</Text>
          </View>
        ) : null}

        <View style={styles.itemsListKitchen}>
          {item.items.map(orderItem => {
            const itemDone = orderItem.status === 'ready' || orderItem.status === 'delivered';
            return (
              <TouchableOpacity
                key={orderItem.id}
                style={[styles.kitchenItem, itemDone && styles.kitchenItemDone]}
                onPress={() => {
                  if (!itemDone && isPreparing) {
                    handleItemReady(item.id, orderItem.id);
                  }
                }}
                disabled={itemDone || !isPreparing}
                activeOpacity={0.6}
              >
                <View style={[styles.itemCheck, itemDone && styles.itemCheckDone]}>
                  {itemDone && <Check size={12} color={Colors.black} />}
                </View>
                <Text style={[styles.itemQty, itemDone && styles.itemTextDone]}>{orderItem.quantity}x</Text>
                <Text style={[styles.itemName, itemDone && styles.itemTextDone]} numberOfLines={2}>
                  {orderItem.product.name}
                </Text>
                {orderItem.notes ? (
                  <Text style={styles.itemNotes} numberOfLines={1}>{orderItem.notes}</Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.cardActions}>
          {item.status === 'confirmed' && (
            <TouchableOpacity
              style={styles.prepareBtn}
              onPress={() => handleStartPreparing(item)}
            >
              <Text style={styles.prepareBtnText}>Empezar a Preparar</Text>
            </TouchableOpacity>
          )}
          {item.status === 'preparing' && (
            <TouchableOpacity
              style={styles.readyBtn}
              onPress={() => handleMarkReady(item)}
            >
              <Check size={18} color={Colors.white} />
              <Text style={styles.readyBtnText}>LISTO</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }, [handleMarkReady, handleStartPreparing, handleItemReady, isTablet]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={[styles.header, isTablet && styles.headerTablet]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={22} color={Colors.silver} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cocina</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{data?.orders?.length ?? 0}</Text>
          </View>
        </View>

        <View style={[styles.tabBar, isTablet && styles.tabBarTablet]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'confirmed' && styles.tabActive]}
            onPress={() => setActiveTab('confirmed')}
          >
            <Text style={[styles.tabText, activeTab === 'confirmed' && styles.tabTextActive]}>
              Por Preparar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'preparing' && styles.tabActive]}
            onPress={() => setActiveTab('preparing')}
          >
            <Text style={[styles.tabText, activeTab === 'preparing' && styles.tabTextActive]}>
              En Preparación
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.gold} size="large" />
          </View>
        ) : (
          <FlatList
            key={`kitchen-${numColumns}`}
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
                <Text style={styles.emptyEmoji}>👨‍🍳</Text>
                <Text style={styles.emptyText}>
                  {activeTab === 'confirmed' ? 'Sin pedidos por preparar' : 'Nada en preparación'}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGold,
  },
  headerTablet: {
    paddingHorizontal: 32,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '300' as const,
    color: Colors.white,
    letterSpacing: 1,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: Colors.jadeGlow,
  },
  countText: {
    color: Colors.jadeBright,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabBarTablet: {
    paddingHorizontal: 28,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.blackCard,
  },
  tabActive: { backgroundColor: Colors.gold },
  tabText: { color: Colors.silverDark, fontSize: 13, fontWeight: '500' as const },
  tabTextActive: { color: Colors.black, fontWeight: '600' as const },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  listTablet: { paddingHorizontal: 28 },
  columnWrapper: { gap: 12 },
  kitchenCard: {
    flex: 1,
    backgroundColor: Colors.blackCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  kitchenCardTablet: {
    maxWidth: '50%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderNum: { color: Colors.white, fontSize: 20, fontWeight: '600' as const },
  tableBadgeKitchen: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.tableBorderJade,
    backgroundColor: Colors.tableBgJade,
  },
  tableBadgeText: { color: Colors.jadeLight, fontSize: 12, fontWeight: '500' as const },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.blackSoft,
  },
  timerUrgent: { backgroundColor: 'rgba(229, 62, 62, 0.12)' },
  timerText: { color: Colors.silverMuted, fontSize: 14, fontWeight: '600' as const, fontVariant: ['tabular-nums'] },
  notesBar: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: Colors.blackSoft,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesBarText: { color: Colors.silverMuted, fontSize: 12 },
  itemsListKitchen: { gap: 6, marginBottom: 14 },
  kitchenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: Colors.blackSoft,
    gap: 10,
  },
  kitchenItemDone: { opacity: 0.4 },
  itemCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.silverDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCheckDone: { backgroundColor: Colors.jade, borderColor: Colors.jade },
  itemQty: { color: Colors.gold, fontSize: 16, fontWeight: '700' as const, minWidth: 28 },
  itemName: { color: Colors.white, fontSize: 15, fontWeight: '500' as const, flex: 1 },
  itemTextDone: { textDecorationLine: 'line-through' as const, color: Colors.silverDark },
  itemNotes: { color: Colors.silverDark, fontSize: 11, fontStyle: 'italic' as const, maxWidth: 100 },
  cardActions: { gap: 8 },
  prepareBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.gold,
  },
  prepareBtnText: { color: Colors.black, fontSize: 15, fontWeight: '600' as const },
  readyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.jade,
    gap: 8,
  },
  readyBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' as const, letterSpacing: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: Colors.silverMuted, fontSize: 15 },
});
