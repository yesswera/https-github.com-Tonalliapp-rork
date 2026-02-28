import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, AlertTriangle, Plus, Minus, X, Package } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import GoldButton from '@/components/GoldButton';
import { apiFetch } from '@/utils/api';
import type { InventoryItem } from '@/constants/types';

export default function InventoryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showMovement, setShowMovement] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [movementType, setMovementType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [movementQty, setMovementQty] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editMinStock, setEditMinStock] = useState('');
  const [editUnit, setEditUnit] = useState('');

  const { data: inventory, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => apiFetch<InventoryItem[]>('/inventory', { auth: true }),
  });

  const { data: alerts } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: () => apiFetch<InventoryItem[]>('/inventory/alerts', { auth: true }).catch(() => []),
  });

  const movementMutation = useMutation({
    mutationFn: (data: { productId: string; type: string; quantity: number; reason: string }) =>
      apiFetch(`/inventory/${data.productId}/movement`, {
        method: 'POST',
        body: { type: data.type, quantity: data.quantity, reason: data.reason },
        auth: true,
      }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
      setShowMovement(false);
      setMovementQty('');
      setMovementReason('');
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const editMutation = useMutation({
    mutationFn: (data: { productId: string; currentStock: number; minStock: number; unit: string }) =>
      apiFetch(`/inventory/${data.productId}`, {
        method: 'PUT',
        body: { currentStock: data.currentStock, minStock: data.minStock, unit: data.unit },
        auth: true,
      }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
      setShowEdit(false);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const getStockLevel = (item: InventoryItem): 'ok' | 'low' | 'critical' => {
    if (item.currentStock <= 0) return 'critical';
    if (item.currentStock <= item.minStock) return 'low';
    return 'ok';
  };

  const getStockColor = (level: string) => {
    if (level === 'critical') return Colors.red;
    if (level === 'low') return Colors.yellow;
    return Colors.jade;
  };

  const openMovement = useCallback((item: InventoryItem, type: 'in' | 'out' | 'adjustment') => {
    setSelectedItem(item);
    setMovementType(type);
    setMovementQty('');
    setMovementReason('');
    setShowMovement(true);
  }, []);

  const openEdit = useCallback((item: InventoryItem) => {
    setSelectedItem(item);
    setEditStock(String(item.currentStock));
    setEditMinStock(String(item.minStock));
    setEditUnit(item.unit || 'pzas');
    setShowEdit(true);
  }, []);

  const alertCount = Array.isArray(alerts) ? alerts.length : 0;
  const inventoryList = Array.isArray(inventory) ? inventory : [];

  const renderItem = useCallback(({ item }: { item: InventoryItem }) => {
    const level = getStockLevel(item);
    const color = getStockColor(level);
    const pct = item.minStock > 0 ? Math.min((item.currentStock / (item.minStock * 3)) * 100, 100) : 50;

    return (
      <TouchableOpacity style={styles.inventoryCard} onPress={() => openEdit(item)} activeOpacity={0.7}>
        <View style={styles.invHeader}>
          <Text style={styles.invName} numberOfLines={1}>{item.productName}</Text>
          <View style={[styles.stockBadge, { backgroundColor: `${color}20` }]}>
            <Text style={[styles.stockBadgeText, { color }]}>
              {item.currentStock} {item.unit || 'pzas'}
            </Text>
          </View>
        </View>

        <View style={styles.barContainer}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>

        <View style={styles.invFooter}>
          <Text style={styles.minStockText}>Mín: {item.minStock}</Text>
          <View style={styles.invActions}>
            <TouchableOpacity
              style={styles.invActionBtn}
              onPress={() => openMovement(item, 'in')}
            >
              <Plus size={14} color={Colors.jade} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.invActionBtn}
              onPress={() => openMovement(item, 'out')}
            >
              <Minus size={14} color={Colors.red} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [openMovement, openEdit]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={22} color={Colors.silver} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inventario</Text>
          {alertCount > 0 && (
            <View style={styles.alertBadge}>
              <AlertTriangle size={12} color={Colors.red} />
              <Text style={styles.alertText}>{alertCount}</Text>
            </View>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.gold} size="large" />
          </View>
        ) : (
          <FlatList
            data={inventoryList}
            renderItem={renderItem}
            keyExtractor={item => item.productId}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.gold} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Package size={40} color={Colors.silverDark} />
                <Text style={styles.emptyText}>Sin inventario configurado</Text>
                <Text style={styles.emptySubtext}>Activa el seguimiento de stock en tus productos</Text>
              </View>
            }
          />
        )}

        <Modal visible={showMovement} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {movementType === 'in' ? 'Entrada' : movementType === 'out' ? 'Salida' : 'Ajuste'} de Stock
                </Text>
                <TouchableOpacity onPress={() => setShowMovement(false)}>
                  <X size={20} color={Colors.silverDark} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalForm}>
                <Text style={styles.modalProductName}>{selectedItem?.productName}</Text>
                <Text style={styles.inputLabel}>CANTIDAD</Text>
                <TextInput
                  style={styles.modalInput}
                  value={movementQty}
                  onChangeText={setMovementQty}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.silverDark}
                />
                <Text style={styles.inputLabel}>RAZÓN</Text>
                <TextInput
                  style={styles.modalInput}
                  value={movementReason}
                  onChangeText={setMovementReason}
                  placeholder="Ej: Compra de proveedor"
                  placeholderTextColor={Colors.silverDark}
                />
                <GoldButton
                  title="Registrar"
                  onPress={() => {
                    if (!selectedItem) return;
                    movementMutation.mutate({
                      productId: selectedItem.productId,
                      type: movementType,
                      quantity: parseInt(movementQty, 10) || 0,
                      reason: movementReason.trim() || 'Sin razón',
                    });
                  }}
                  loading={movementMutation.isPending}
                  disabled={!movementQty.trim()}
                />
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={showEdit} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Configurar Stock</Text>
                <TouchableOpacity onPress={() => setShowEdit(false)}>
                  <X size={20} color={Colors.silverDark} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalForm}>
                <Text style={styles.modalProductName}>{selectedItem?.productName}</Text>
                <Text style={styles.inputLabel}>STOCK ACTUAL</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editStock}
                  onChangeText={setEditStock}
                  keyboardType="number-pad"
                  placeholderTextColor={Colors.silverDark}
                />
                <Text style={styles.inputLabel}>STOCK MÍNIMO</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editMinStock}
                  onChangeText={setEditMinStock}
                  keyboardType="number-pad"
                  placeholderTextColor={Colors.silverDark}
                />
                <Text style={styles.inputLabel}>UNIDAD</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editUnit}
                  onChangeText={setEditUnit}
                  placeholder="pzas, kg, lt..."
                  placeholderTextColor={Colors.silverDark}
                />
                <GoldButton
                  title="Guardar"
                  onPress={() => {
                    if (!selectedItem) return;
                    editMutation.mutate({
                      productId: selectedItem.productId,
                      currentStock: parseInt(editStock, 10) || 0,
                      minStock: parseInt(editMinStock, 10) || 0,
                      unit: editUnit.trim() || 'pzas',
                    });
                  }}
                  loading={editMutation.isPending}
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
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '300' as const, color: Colors.white, letterSpacing: 1 },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(229, 62, 62, 0.12)',
  },
  alertText: { color: Colors.red, fontSize: 12, fontWeight: '700' as const },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  inventoryCard: {
    backgroundColor: Colors.blackCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  invHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  invName: { color: Colors.white, fontSize: 15, fontWeight: '500' as const, flex: 1, marginRight: 10 },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  stockBadgeText: { fontSize: 13, fontWeight: '600' as const },
  barContainer: {
    height: 4,
    backgroundColor: Colors.blackSoft,
    borderRadius: 2,
    marginBottom: 10,
    overflow: 'hidden',
  },
  barFill: { height: 4, borderRadius: 2 },
  invFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  minStockText: { color: Colors.silverDark, fontSize: 11 },
  invActions: { flexDirection: 'row', gap: 8 },
  invActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.blackSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyText: { color: Colors.white, fontSize: 16, fontWeight: '500' as const },
  emptySubtext: { color: Colors.silverMuted, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.blackRich,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
  modalProductName: { color: Colors.gold, fontSize: 16, fontWeight: '500' as const, marginBottom: 4 },
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
});
