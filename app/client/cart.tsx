import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Minus, Trash2, MessageSquare } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import GoldButton from '@/components/GoldButton';
import { useCart } from '@/providers/CartProvider';
import { useClient } from '@/providers/ClientProvider';
import { apiFetch } from '@/utils/api';
import type { CartItem, Order } from '@/constants/types';

export default function CartScreen() {
  const router = useRouter();
  const { items, orderNotes, setOrderNotes, addItem, removeItem, totalItems, totalPrice, clearCart } = useCart();
  const { slug, tableNumber, setActiveOrder } = useClient();

  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        slug,
        tableNumber,
        items: items.map(i => ({
          productId: i.product.id,
          quantity: i.quantity,
          ...(i.notes ? { notes: i.notes } : {}),
        })),
        ...(orderNotes ? { notes: orderNotes } : {}),
      };
      return apiFetch<Order>('/client/orders', { method: 'POST', body: payload });
    },
    onSuccess: async (order) => {
      console.log('[Cart] Order submitted:', order.orderNumber);
      await setActiveOrder(order.id);
      clearCart();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/client/tracking');
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message);
    },
  });

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => (
      <View style={styles.cartItem}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
          <Text style={styles.itemPrice}>${parseFloat(item.product.price).toFixed(2)} c/u</Text>
          {item.notes ? (
            <Text style={styles.itemNotes} numberOfLines={1}>📝 {item.notes}</Text>
          ) : null}
        </View>
        <View style={styles.itemControls}>
          <TouchableOpacity
            onPress={() => removeItem(item.product.id)}
            style={styles.controlBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {item.quantity === 1 ? (
              <Trash2 size={14} color={Colors.red} />
            ) : (
              <Minus size={14} color={Colors.gold} />
            )}
          </TouchableOpacity>
          <Text style={styles.qty}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => addItem(item.product)}
            style={styles.controlBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Plus size={14} color={Colors.gold} />
          </TouchableOpacity>
          <Text style={styles.itemTotal}>
            ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
          </Text>
        </View>
      </View>
    ),
    [addItem, removeItem]
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color={Colors.silver} />
            <Text style={styles.backText}>Menú</Text>
          </TouchableOpacity>
          <Text style={styles.headerCount}>{totalItems} items</Text>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title}>Tu Pedido</Text>
          <Text style={styles.subtitle}>Mesa {tableNumber}</Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
            <Text style={styles.emptySubtitle}>Agrega platillos desde el menú</Text>
            <GoldButton title="Ver menú" onPress={() => router.back()} variant="outline" style={{ marginTop: 16 }} />
          </View>
        ) : (
          <>
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={item => item.product.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                <View style={styles.footer}>
                  <View style={styles.notesSection}>
                    <View style={styles.notesHeader}>
                      <MessageSquare size={14} color={Colors.silverMuted} />
                      <Text style={styles.notesLabel}>NOTAS PARA LA COCINA</Text>
                    </View>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Alergias, preferencias, etc."
                      placeholderTextColor={Colors.silverDark}
                      value={orderNotes}
                      onChangeText={setOrderNotes}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.totalsSection}>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Subtotal</Text>
                      <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.totalRow}>
                      <Text style={styles.grandTotalLabel}>Total</Text>
                      <Text style={styles.grandTotalValue}>${totalPrice.toFixed(2)}</Text>
                    </View>
                  </View>

                  <GoldButton
                    title="Enviar Pedido →"
                    onPress={() => submitMutation.mutate()}
                    loading={submitMutation.isPending}
                    style={{ marginTop: 8 }}
                  />
                </View>
              }
            />
          </>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGold,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    color: Colors.silver,
    fontSize: 15,
  },
  headerCount: {
    color: Colors.silverMuted,
    fontSize: 13,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '300' as const,
    color: Colors.white,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.silverMuted,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '500' as const,
  },
  emptySubtitle: {
    color: Colors.silverMuted,
    fontSize: 14,
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  cartItem: {
    backgroundColor: Colors.blackCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  itemInfo: {
    marginBottom: 10,
  },
  itemName: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  itemPrice: {
    color: Colors.silverDark,
    fontSize: 12,
    marginTop: 2,
  },
  itemNotes: {
    color: Colors.silverMuted,
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
    minWidth: 20,
    textAlign: 'center' as const,
  },
  itemTotal: {
    color: Colors.gold,
    fontSize: 15,
    fontWeight: '600' as const,
    marginLeft: 'auto',
  },
  footer: {
    paddingTop: 16,
    gap: 16,
  },
  notesSection: {
    gap: 8,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notesLabel: {
    color: Colors.silverMuted,
    fontSize: 10,
    fontWeight: '500' as const,
    letterSpacing: 1.5,
  },
  notesInput: {
    backgroundColor: Colors.blackCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.white,
    fontSize: 14,
    minHeight: 72,
  },
  totalsSection: {
    backgroundColor: Colors.blackCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: Colors.silverMuted,
    fontSize: 14,
  },
  totalValue: {
    color: Colors.silver,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 10,
  },
  grandTotalLabel: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  grandTotalValue: {
    color: Colors.gold,
    fontSize: 18,
    fontWeight: '600' as const,
  },
});
