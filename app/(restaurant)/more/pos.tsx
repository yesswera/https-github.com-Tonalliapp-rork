import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  DollarSign,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  X,
  Lock,
  Unlock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import GoldButton from '@/components/GoldButton';
import { apiFetch } from '@/utils/api';
import type { CashRegister, Payment, Order } from '@/constants/types';

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

const METHOD_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote size={16} color={Colors.jade} />,
  card: <CreditCard size={16} color={Colors.gold} />,
  transfer: <ArrowRightLeft size={16} color={Colors.silver} />,
};

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};

export default function POSScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('500');
  const [closingAmount, setClosingAmount] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [payReference, setPayReference] = useState('');

  const { data: register, isLoading: regLoading, refetch: refetchReg } = useQuery({
    queryKey: ['cash-register'],
    queryFn: () => apiFetch<CashRegister>('/cash-register/current', { auth: true }).catch(() => null),
  });

  const { data: payments, refetch: refetchPayments } = useQuery({
    queryKey: ['payments-today'],
    queryFn: () => {
      const today = new Date().toISOString().split('T')[0];
      return apiFetch<Payment[]>(`/payments?from=${today}&to=${today}`, { auth: true }).catch(() => []);
    },
  });

  const { data: deliveredOrders } = useQuery({
    queryKey: ['delivered-orders'],
    queryFn: () => apiFetch<OrdersResponse>('/orders?status=delivered&limit=50', { auth: true }),
    refetchInterval: 15000,
  });

  const openMutation = useMutation({
    mutationFn: (amount: number) =>
      apiFetch('/cash-register/open', { method: 'POST', body: { openingAmount: amount }, auth: true }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['cash-register'] });
      setShowOpenModal(false);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const closeMutation = useMutation({
    mutationFn: (data: { closingAmount: number; notes?: string }) =>
      apiFetch('/cash-register/close', { method: 'POST', body: data, auth: true }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['cash-register'] });
      setShowCloseModal(false);
      setClosingAmount('');
      setCloseNotes('');
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const payMutation = useMutation({
    mutationFn: (data: { orderId: string; method: string; amount: number; reference?: string }) =>
      apiFetch('/payments', { method: 'POST', body: data, auth: true }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['payments-today'] });
      queryClient.invalidateQueries({ queryKey: ['delivered-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setShowPayModal(false);
      setSelectedOrder(null);
      setPayReference('');
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const handlePayOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setPayMethod('cash');
    setPayReference('');
    setShowPayModal(true);
  }, []);

  const isOpen = register && register.status === 'open';
  const paymentsList = Array.isArray(payments) ? payments : [];
  const totalCollected = paymentsList.reduce((s, p) => s + parseFloat(p.amount || '0'), 0);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={[styles.header, isTablet && styles.headerTablet]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={22} color={Colors.silver} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Caja / POS</Text>
          <View style={[styles.statusBadge, { backgroundColor: isOpen ? Colors.jadeGlow : Colors.statusPreparingBg }]}>
            {isOpen ? <Unlock size={12} color={Colors.jade} /> : <Lock size={12} color={Colors.silverDark} />}
            <Text style={[styles.statusText, { color: isOpen ? Colors.jade : Colors.silverDark }]}>
              {isOpen ? 'Abierta' : 'Cerrada'}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, isTablet && styles.scrollTablet]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={regLoading} onRefresh={() => { refetchReg(); refetchPayments(); }} tintColor={Colors.gold} />}
        >
          {!isOpen ? (
            <View style={styles.closedCard}>
              <Lock size={32} color={Colors.silverDark} />
              <Text style={styles.closedTitle}>Caja Cerrada</Text>
              <Text style={styles.closedSubtitle}>Abre la caja para empezar a cobrar</Text>
              <GoldButton title="Abrir Caja" onPress={() => setShowOpenModal(true)} style={{ marginTop: 16 }} />
            </View>
          ) : (
            <>
              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>APERTURA</Text>
                  <Text style={styles.summaryValue}>${parseFloat(register.openingAmount || '0').toFixed(2)}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>COBRADO HOY</Text>
                  <Text style={[styles.summaryValue, { color: Colors.jade }]}>${totalCollected.toFixed(2)}</Text>
                </View>
              </View>

              <GoldButton
                title="Cerrar Caja"
                variant="outline"
                onPress={() => setShowCloseModal(true)}
                style={{ marginBottom: 20 }}
              />

              {(deliveredOrders?.orders?.length ?? 0) > 0 && (
                <>
                  <Text style={styles.sectionLabel}>PEDIDOS POR COBRAR</Text>
                  {deliveredOrders?.orders.map(order => (
                    <TouchableOpacity
                      key={order.id}
                      style={styles.payableOrder}
                      onPress={() => handlePayOrder(order)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.payableLeft}>
                        <Text style={styles.payableNumber}>#{String(order.orderNumber).padStart(3, '0')}</Text>
                        <Text style={styles.payableTable}>Mesa {order.table.number}</Text>
                      </View>
                      <View style={styles.payableRight}>
                        <Text style={styles.payableTotal}>${parseFloat(order.total).toFixed(2)}</Text>
                        <DollarSign size={16} color={Colors.gold} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {paymentsList.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: 20 }]}>COBROS DE HOY</Text>
                  {paymentsList.slice(0, 20).map(payment => (
                    <View key={payment.id} style={styles.paymentRow}>
                      {METHOD_ICONS[payment.method]}
                      <Text style={styles.paymentMethod}>{METHOD_LABELS[payment.method] ?? payment.method}</Text>
                      <Text style={styles.paymentRef}>
                        {payment.reference ? `Ref: ${payment.reference}` : ''}
                      </Text>
                      <Text style={styles.paymentAmount}>${parseFloat(payment.amount).toFixed(2)}</Text>
                    </View>
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>

        <Modal visible={showOpenModal} transparent animationType="slide">
          <View style={[styles.modalOverlay, isTablet && styles.modalOverlayTablet]}>
            <View style={[styles.modalContent, isTablet && styles.modalContentTablet]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Abrir Caja</Text>
                <TouchableOpacity onPress={() => setShowOpenModal(false)}>
                  <X size={20} color={Colors.silverDark} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalForm}>
                <Text style={styles.inputLabel}>MONTO INICIAL</Text>
                <TextInput
                  style={styles.modalInput}
                  value={openingAmount}
                  onChangeText={setOpeningAmount}
                  keyboardType="decimal-pad"
                  placeholder="500.00"
                  placeholderTextColor={Colors.silverDark}
                />
                <GoldButton
                  title="Abrir Caja"
                  onPress={() => openMutation.mutate(parseFloat(openingAmount) || 0)}
                  loading={openMutation.isPending}
                />
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={showCloseModal} transparent animationType="slide">
          <View style={[styles.modalOverlay, isTablet && styles.modalOverlayTablet]}>
            <View style={[styles.modalContent, isTablet && styles.modalContentTablet]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Cerrar Caja</Text>
                <TouchableOpacity onPress={() => setShowCloseModal(false)}>
                  <X size={20} color={Colors.silverDark} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalForm}>
                <Text style={styles.inputLabel}>MONTO EN CAJA</Text>
                <TextInput
                  style={styles.modalInput}
                  value={closingAmount}
                  onChangeText={setClosingAmount}
                  keyboardType="decimal-pad"
                  placeholder="12500.00"
                  placeholderTextColor={Colors.silverDark}
                />
                <Text style={styles.inputLabel}>NOTAS (OPCIONAL)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={closeNotes}
                  onChangeText={setCloseNotes}
                  placeholder="Observaciones del turno"
                  placeholderTextColor={Colors.silverDark}
                />
                <GoldButton
                  title="Cerrar Caja"
                  onPress={() => closeMutation.mutate({
                    closingAmount: parseFloat(closingAmount) || 0,
                    ...(closeNotes.trim() ? { notes: closeNotes.trim() } : {}),
                  })}
                  loading={closeMutation.isPending}
                />
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={showPayModal} transparent animationType="slide">
          <View style={[styles.modalOverlay, isTablet && styles.modalOverlayTablet]}>
            <View style={[styles.modalContent, isTablet && styles.modalContentTablet]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Cobrar #{selectedOrder ? String(selectedOrder.orderNumber).padStart(3, '0') : ''}
                </Text>
                <TouchableOpacity onPress={() => setShowPayModal(false)}>
                  <X size={20} color={Colors.silverDark} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalForm}>
                <Text style={styles.payTotalLabel}>TOTAL A COBRAR</Text>
                <Text style={styles.payTotalValue}>
                  ${selectedOrder ? parseFloat(selectedOrder.total).toFixed(2) : '0.00'}
                </Text>

                <Text style={styles.inputLabel}>MÉTODO DE PAGO</Text>
                <View style={styles.methodRow}>
                  {(['cash', 'card', 'transfer'] as const).map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.methodBtn, payMethod === m && styles.methodBtnActive]}
                      onPress={() => setPayMethod(m)}
                    >
                      {METHOD_ICONS[m]}
                      <Text style={[styles.methodLabel, payMethod === m && styles.methodLabelActive]}>
                        {METHOD_LABELS[m]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {payMethod !== 'cash' && (
                  <>
                    <Text style={styles.inputLabel}>REFERENCIA</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={payReference}
                      onChangeText={setPayReference}
                      placeholder="No. de voucher o referencia"
                      placeholderTextColor={Colors.silverDark}
                    />
                  </>
                )}

                <GoldButton
                  title="Cobrar"
                  onPress={() => {
                    if (!selectedOrder) return;
                    payMutation.mutate({
                      orderId: selectedOrder.id,
                      method: payMethod,
                      amount: parseFloat(selectedOrder.total),
                      ...(payReference.trim() ? { reference: payReference.trim() } : {}),
                    });
                  }}
                  loading={payMutation.isPending}
                />
              </View>
            </View>
          </View>
        </Modal>
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
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '300' as const, color: Colors.white, letterSpacing: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '600' as const },
  scroll: { padding: 20, paddingBottom: 40 },
  scrollTablet: { paddingHorizontal: 32, maxWidth: 720, alignSelf: 'center' as const, width: '100%' as const },
  closedCard: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  closedTitle: { color: Colors.white, fontSize: 20, fontWeight: '300' as const, marginTop: 8 },
  closedSubtitle: { color: Colors.silverMuted, fontSize: 13 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.blackCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  summaryLabel: { color: Colors.silverMuted, fontSize: 9, fontWeight: '500' as const, letterSpacing: 1.5, marginBottom: 6 },
  summaryValue: { color: Colors.gold, fontSize: 22, fontWeight: '600' as const },
  sectionLabel: { color: Colors.goldMuted, fontSize: 10, fontWeight: '500' as const, letterSpacing: 2, marginBottom: 10 },
  payableOrder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.blackCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  payableLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  payableNumber: { color: Colors.white, fontSize: 15, fontWeight: '600' as const },
  payableTable: { color: Colors.jadeLight, fontSize: 12 },
  payableRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  payableTotal: { color: Colors.gold, fontSize: 16, fontWeight: '600' as const },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.blackCard,
    borderRadius: 10,
    marginBottom: 6,
    gap: 8,
  },
  paymentMethod: { color: Colors.silver, fontSize: 13, fontWeight: '500' as const },
  paymentRef: { flex: 1, color: Colors.silverDark, fontSize: 11, textAlign: 'right' as const },
  paymentAmount: { color: Colors.gold, fontSize: 14, fontWeight: '600' as const, marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' as const },
  modalOverlayTablet: { justifyContent: 'center' as const, alignItems: 'center' as const, padding: 40 },
  modalContentTablet: { maxWidth: 500, width: '100%' as const, borderRadius: 20 },
  modalContent: {
    backgroundColor: Colors.blackRich,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: { color: Colors.white, fontSize: 18, fontWeight: '500' as const },
  modalForm: { padding: 20, gap: 14 },
  inputLabel: { color: Colors.goldMuted, fontSize: 10, fontWeight: '500' as const, letterSpacing: 2 },
  modalInput: {
    backgroundColor: Colors.blackCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.white,
    fontSize: 15,
  },
  payTotalLabel: { color: Colors.silverMuted, fontSize: 10, letterSpacing: 2, textAlign: 'center' as const },
  payTotalValue: { color: Colors.gold, fontSize: 36, fontWeight: '600' as const, textAlign: 'center' as const, marginBottom: 8 },
  methodRow: { flexDirection: 'row', gap: 8 },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.blackCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  methodBtnActive: { borderColor: Colors.gold, backgroundColor: Colors.statusPendingBg },
  methodLabel: { color: Colors.silverDark, fontSize: 12, fontWeight: '500' as const },
  methodLabelActive: { color: Colors.gold },
});
