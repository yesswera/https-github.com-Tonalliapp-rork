import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UtensilsCrossed, Receipt, Bell, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import GoldButton from '@/components/GoldButton';
import StatusBadge from '@/components/StatusBadge';
import { useClient } from '@/providers/ClientProvider';
import { apiFetch } from '@/utils/api';
import type { Order, OrderStatus } from '@/constants/types';

const TIMELINE_STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'pending', label: 'Pedido recibido', icon: '📋' },
  { status: 'confirmed', label: 'Confirmado', icon: '✅' },
  { status: 'preparing', label: 'En preparación', icon: '👨‍🍳' },
  { status: 'ready', label: '¡Listo!', icon: '🔔' },
  { status: 'delivered', label: 'Entregado', icon: '🍽' },
  { status: 'paid', label: 'Pagado', icon: '💳' },
];

function getStepIndex(status: OrderStatus): number {
  const idx = TIMELINE_STEPS.findIndex(s => s.status === status);
  return idx >= 0 ? idx : 0;
}

export default function TrackingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { activeOrderId, slug, tableNumber } = useClient();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { data: order, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['order', activeOrderId],
    queryFn: () => apiFetch<Order>(`/client/orders/${activeOrderId}`),
    enabled: !!activeOrderId,
    refetchInterval: 15000,
  });

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (order?.status === 'ready') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [order?.status]);

  const requestBillMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>('/client/orders/request-bill', {
        method: 'POST',
        body: { slug, tableNumber },
      }),
    onSuccess: (data) => {
      Alert.alert('Cuenta solicitada', data.message);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const callWaiterMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>('/client/orders/call-waiter', {
        method: 'POST',
        body: { slug, tableNumber },
      }),
    onSuccess: (data) => {
      Alert.alert('Mesero en camino', data.message);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const currentStep = order ? getStepIndex(order.status) : 0;
  const isCancelled = order?.status === 'cancelled';

  if (isLoading || !order) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Cargando pedido...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={[styles.scroll, isTablet && styles.scrollTablet]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.gold} />
          }
        >
          <View style={styles.orderHeader}>
            <Text style={styles.orderLabel}>PEDIDO</Text>
            <Text style={styles.orderNumber}>#{String(order.orderNumber).padStart(3, '0')}</Text>
            <StatusBadge status={order.status} size="medium" />
            <Text style={styles.tableInfo}>Mesa {order.table.number}</Text>
          </View>

          {isCancelled ? (
            <View style={styles.cancelledSection}>
              <Text style={styles.cancelledEmoji}>❌</Text>
              <Text style={styles.cancelledText}>Pedido cancelado</Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {TIMELINE_STEPS.map((step, idx) => {
                const isCompleted = idx <= currentStep;
                const isCurrent = idx === currentStep;
                const isLast = idx === TIMELINE_STEPS.length - 1;

                return (
                  <View key={step.status} style={styles.timelineStep}>
                    <View style={styles.timelineIndicator}>
                      {isCurrent ? (
                        <Animated.View
                          style={[
                            styles.dotCurrent,
                            { transform: [{ scale: pulseAnim }] },
                          ]}
                        >
                          <Text style={styles.stepIcon}>{step.icon}</Text>
                        </Animated.View>
                      ) : (
                        <View
                          style={[
                            styles.dot,
                            isCompleted ? styles.dotCompleted : styles.dotPending,
                          ]}
                        >
                          {isCompleted && <Text style={styles.stepIconSmall}>{step.icon}</Text>}
                        </View>
                      )}
                      {!isLast && (
                        <View
                          style={[
                            styles.line,
                            isCompleted && idx < currentStep ? styles.lineCompleted : styles.linePending,
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.stepContent}>
                      <Text
                        style={[
                          styles.stepLabel,
                          isCurrent && styles.stepLabelCurrent,
                          isCompleted && !isCurrent && styles.stepLabelCompleted,
                        ]}
                      >
                        {step.label}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Resumen</Text>
            {order.items.map(item => (
              <View key={item.id} style={styles.orderItem}>
                <View style={styles.orderItemLeft}>
                  <Text style={styles.orderItemQty}>{item.quantity}x</Text>
                  <View>
                    <Text style={styles.orderItemName}>{item.product.name}</Text>
                    {item.notes ? (
                      <Text style={styles.orderItemNotes}>{item.notes}</Text>
                    ) : null}
                  </View>
                </View>
                <Text style={styles.orderItemPrice}>${parseFloat(item.subtotal).toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.totalBar}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${parseFloat(order.total).toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => requestBillMutation.mutate()}
              disabled={requestBillMutation.isPending}
            >
              <Receipt size={18} color={Colors.gold} />
              <Text style={styles.actionText}>Pedir la cuenta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => callWaiterMutation.mutate()}
              disabled={callWaiterMutation.isPending}
            >
              <Bell size={18} color={Colors.jade} />
              <Text style={[styles.actionText, { color: Colors.jade }]}>Llamar mesero</Text>
            </TouchableOpacity>
          </View>

          <GoldButton
            title="Ordenar más"
            onPress={() => router.push('/client/menu')}
            variant="outline"
            icon={<UtensilsCrossed size={16} color={Colors.gold} />}
            style={{ marginTop: 8, marginHorizontal: 16 }}
          />
        </ScrollView>
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.silverMuted,
    fontSize: 14,
  },
  scroll: {
    paddingBottom: 40,
  },
  scrollTablet: {
    maxWidth: 600,
    alignSelf: 'center' as const,
    width: '100%' as const,
  },
  orderHeader: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  orderLabel: {
    color: Colors.silverMuted,
    fontSize: 10,
    fontWeight: '500' as const,
    letterSpacing: 3,
  },
  orderNumber: {
    fontSize: 44,
    fontWeight: '300' as const,
    color: Colors.gold,
    letterSpacing: 2,
  },
  tableInfo: {
    color: Colors.jadeLight,
    fontSize: 13,
    marginTop: 4,
  },
  cancelledSection: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  cancelledEmoji: {
    fontSize: 48,
  },
  cancelledText: {
    color: Colors.red,
    fontSize: 18,
    fontWeight: '500' as const,
  },
  timeline: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  timelineStep: {
    flexDirection: 'row',
    minHeight: 52,
  },
  timelineIndicator: {
    alignItems: 'center',
    width: 44,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCompleted: {
    backgroundColor: Colors.jadeGlow,
    borderWidth: 1.5,
    borderColor: Colors.jade,
  },
  dotPending: {
    backgroundColor: Colors.blackCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  dotCurrent: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.goldGlow,
    borderWidth: 2,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIcon: {
    fontSize: 16,
  },
  stepIconSmall: {
    fontSize: 14,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 16,
  },
  lineCompleted: {
    backgroundColor: Colors.jade,
  },
  linePending: {
    backgroundColor: Colors.borderLight,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 12,
    paddingBottom: 16,
  },
  stepLabel: {
    color: Colors.silverDark,
    fontSize: 14,
    fontWeight: '400' as const,
  },
  stepLabelCurrent: {
    color: Colors.gold,
    fontWeight: '600' as const,
    fontSize: 15,
  },
  stepLabelCompleted: {
    color: Colors.jadeLight,
    fontWeight: '500' as const,
  },
  itemsSection: {
    marginHorizontal: 16,
    backgroundColor: Colors.blackCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  sectionTitle: {
    color: Colors.silverMuted,
    fontSize: 10,
    fontWeight: '500' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  orderItemLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  orderItemQty: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: '600' as const,
    minWidth: 24,
  },
  orderItemName: {
    color: Colors.white,
    fontSize: 14,
  },
  orderItemNotes: {
    color: Colors.silverDark,
    fontSize: 11,
    fontStyle: 'italic' as const,
    marginTop: 2,
  },
  orderItemPrice: {
    color: Colors.silver,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  totalValue: {
    color: Colors.gold,
    fontSize: 17,
    fontWeight: '600' as const,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.blackCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionText: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: '500' as const,
  },
});
