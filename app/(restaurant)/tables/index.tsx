import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Animated,
  Linking,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Users, QrCode, ExternalLink, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import GoldButton from '@/components/GoldButton';
import { apiFetch } from '@/utils/api';
import type { Table, QRData } from '@/constants/types';

const TABLE_STATUS_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  free: { bg: Colors.blackCard, border: Colors.borderLight, text: Colors.silverDark, label: 'Libre' },
  occupied: { bg: 'rgba(201, 168, 76, 0.08)', border: Colors.gold, text: Colors.gold, label: 'Ocupada' },
  ordering: { bg: Colors.tableBgJade, border: Colors.jade, text: Colors.jadeLight, label: 'Pidiendo' },
  bill: { bg: Colors.statusPreparingBg, border: Colors.silver, text: Colors.silver, label: 'Cuenta' },
};

function PulsingDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);
  return (
    <Animated.View style={[styles.pulsingDot, { backgroundColor: color, opacity: pulse }]} />
  );
}

export default function TablesScreen() {
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const numColumns = isTablet ? 5 : 3;

  const [showAdd, setShowAdd] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState('4');

  const { data: tables, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['tables'],
    queryFn: () => apiFetch<Table[]>('/tables', { auth: true }),
    refetchInterval: 15000,
  });

  const addTableMutation = useMutation({
    mutationFn: (data: { number: number; capacity: number }) =>
      apiFetch('/tables', { method: 'POST', body: data, auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setShowAdd(false);
      setNewNumber('');
      setNewCapacity('4');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/tables/${id}/status`, { method: 'PATCH', body: { status }, auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const deleteTableMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/tables/${id}`, { method: 'DELETE', auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setShowDetail(false);
      setSelectedTable(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const fetchQR = useCallback(async (table: Table) => {
    setSelectedTable(table);
    setQrLoading(true);
    setShowQR(true);
    try {
      const data = await apiFetch<QRData>(`/tables/${table.id}/qr`, { auth: true });
      setQrData(data);
      console.log('[Tables] QR fetched for table', table.number);
    } catch (err) {
      console.log('[Tables] QR fetch error:', err);
      Alert.alert('Error', 'No se pudo generar el QR');
      setShowQR(false);
    } finally {
      setQrLoading(false);
    }
  }, []);

  const handleTablePress = useCallback((table: Table) => {
    setSelectedTable(table);
    setShowDetail(true);
  }, []);

  const handleStatusChange = useCallback((table: Table, status: string) => {
    updateStatusMutation.mutate({ id: table.id, status });
    setShowDetail(false);
  }, [updateStatusMutation]);

  const handleDelete = useCallback((table: Table) => {
    Alert.alert(
      'Eliminar mesa',
      `¿Eliminar mesa ${table.number}?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteTableMutation.mutate(table.id) },
      ]
    );
  }, [deleteTableMutation]);

  const renderTable = useCallback(
    ({ item }: { item: Table }) => {
      const config = TABLE_STATUS_COLORS[item.status] ?? TABLE_STATUS_COLORS.free;
      const isOrdering = item.status === 'ordering';
      return (
        <TouchableOpacity
          style={[styles.tableCard, { backgroundColor: config.bg, borderColor: config.border }]}
          onPress={() => handleTablePress(item)}
          onLongPress={() => fetchQR(item)}
          activeOpacity={0.7}
        >
          {isOrdering && <PulsingDot color={Colors.jade} />}
          <Text style={[styles.tableNumber, { color: config.text }]}>{item.number}</Text>
          <Text style={[styles.tableStatus, { color: config.text }]}>{config.label}</Text>
          <View style={styles.tableCapacity}>
            <Users size={10} color={Colors.silverDark} />
            <Text style={styles.capacityText}>{item.capacity}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handleTablePress, fetchQR]
  );

  const sortedTables = (tables ?? []).sort((a, b) => a.number - b.number);
  const freeCount = sortedTables.filter(t => t.status === 'free').length;
  const occupiedCount = sortedTables.filter(t => t.status !== 'free').length;

  const modalMaxWidth = isTablet ? 500 : undefined;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={[styles.screenHeader, isTablet && styles.screenHeaderTablet]}>
          <View>
            <Text style={styles.screenTitle}>Mesas</Text>
            <Text style={styles.screenSubtitle}>
              {freeCount} libres · {occupiedCount} ocupadas
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAdd(true)}
          >
            <Plus size={16} color={Colors.gold} />
          </TouchableOpacity>
        </View>

        <View style={[styles.legend, isTablet && styles.legendTablet]}>
          {Object.entries(TABLE_STATUS_COLORS).map(([key, val]) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: val.text }]} />
              <Text style={styles.legendText}>{val.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.hintText}>Mantén presionado para ver QR</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.gold} size="large" />
          </View>
        ) : (
          <FlatList
            key={`tables-grid-${numColumns}`}
            data={sortedTables}
            renderItem={renderTable}
            keyExtractor={item => item.id}
            numColumns={numColumns}
            contentContainerStyle={[styles.grid, isTablet && styles.gridTablet]}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.gold} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🪑</Text>
                <Text style={styles.emptyText}>Sin mesas configuradas</Text>
                <Text style={styles.emptySubtext}>Agrega tu primera mesa para empezar</Text>
              </View>
            }
          />
        )}

        <Modal visible={showAdd} transparent animationType="slide">
          <View style={[styles.modalOverlay, isTablet && styles.modalOverlayTablet]}>
            <View style={[styles.modalContent, isTablet && { maxWidth: modalMaxWidth, width: '100%', borderRadius: 20 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nueva Mesa</Text>
                <TouchableOpacity onPress={() => setShowAdd(false)}>
                  <X size={20} color={Colors.silverDark} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <View style={styles.modalForm}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>NÚMERO DE MESA</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Ej: 1"
                      placeholderTextColor={Colors.silverDark}
                      value={newNumber}
                      onChangeText={setNewNumber}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>CAPACIDAD</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Ej: 4"
                      placeholderTextColor={Colors.silverDark}
                      value={newCapacity}
                      onChangeText={setNewCapacity}
                      keyboardType="number-pad"
                    />
                  </View>
                  <GoldButton
                    title="Crear Mesa"
                    onPress={() =>
                      addTableMutation.mutate({
                        number: parseInt(newNumber, 10) || 1,
                        capacity: parseInt(newCapacity, 10) || 4,
                      })
                    }
                    loading={addTableMutation.isPending}
                    disabled={!newNumber.trim()}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal visible={showDetail} transparent animationType="fade">
          <View style={[styles.modalOverlay, isTablet && styles.modalOverlayTablet]}>
            <View style={[styles.detailModal, isTablet && { maxWidth: modalMaxWidth, width: '100%', borderRadius: 20 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Mesa {selectedTable?.number}</Text>
                <TouchableOpacity onPress={() => setShowDetail(false)}>
                  <X size={20} color={Colors.silverDark} />
                </TouchableOpacity>
              </View>

              {selectedTable && (
                <View style={styles.detailBody}>
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailLabel}>Estado</Text>
                    <Text style={[styles.detailValue, { color: TABLE_STATUS_COLORS[selectedTable.status]?.text ?? Colors.silver }]}>
                      {TABLE_STATUS_COLORS[selectedTable.status]?.label ?? selectedTable.status}
                    </Text>
                  </View>
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailLabel}>Capacidad</Text>
                    <Text style={styles.detailValue}>{selectedTable.capacity} personas</Text>
                  </View>

                  <Text style={styles.changeLabel}>CAMBIAR ESTADO</Text>
                  <View style={styles.statusGrid}>
                    {(['free', 'occupied', 'ordering', 'bill'] as const).map(s => {
                      const cfg = TABLE_STATUS_COLORS[s];
                      const isCurrent = selectedTable.status === s;
                      return (
                        <TouchableOpacity
                          key={s}
                          style={[
                            styles.statusBtn,
                            isCurrent && { borderColor: cfg.text, backgroundColor: cfg.bg },
                          ]}
                          onPress={() => !isCurrent && handleStatusChange(selectedTable, s)}
                          disabled={isCurrent}
                        >
                          <View style={[styles.statusDotSmall, { backgroundColor: cfg.text }]} />
                          <Text style={[styles.statusBtnText, isCurrent && { color: cfg.text }]}>
                            {cfg.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.detailActions}>
                    <TouchableOpacity
                      style={styles.qrBtn}
                      onPress={() => {
                        setShowDetail(false);
                        fetchQR(selectedTable);
                      }}
                    >
                      <QrCode size={16} color={Colors.gold} />
                      <Text style={styles.qrBtnText}>Ver QR</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(selectedTable)}
                    >
                      <Trash2 size={16} color={Colors.red} />
                      <Text style={styles.deleteBtnText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>

        <Modal visible={showQR} transparent animationType="slide">
          <View style={[styles.modalOverlay, isTablet && styles.modalOverlayTablet]}>
            <View style={[styles.qrModal, isTablet && { maxWidth: modalMaxWidth, width: '100%', borderRadius: 20 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>QR Mesa {selectedTable?.number}</Text>
                <TouchableOpacity onPress={() => { setShowQR(false); setQrData(null); }}>
                  <X size={20} color={Colors.silverDark} />
                </TouchableOpacity>
              </View>

              <View style={styles.qrBody}>
                {qrLoading ? (
                  <View style={styles.qrLoading}>
                    <ActivityIndicator color={Colors.gold} size="large" />
                    <Text style={styles.qrLoadingText}>Generando QR...</Text>
                  </View>
                ) : qrData ? (
                  <>
                    <View style={styles.qrImageContainer}>
                      <Image
                        source={{ uri: qrData.qrCode }}
                        style={styles.qrImage}
                        contentFit="contain"
                      />
                    </View>
                    <Text style={styles.qrTableNumber}>Mesa {qrData.tableNumber}</Text>
                    <Text style={styles.qrUrl}>{qrData.menuUrl}</Text>

                    <TouchableOpacity
                      style={styles.openUrlBtn}
                      onPress={() => {
                        if (qrData.menuUrl) {
                          Linking.openURL(qrData.menuUrl).catch(() => {});
                        }
                      }}
                    >
                      <ExternalLink size={14} color={Colors.gold} />
                      <Text style={styles.openUrlText}>Abrir URL del menú</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.qrErrorText}>No se pudo generar el QR</Text>
                )}
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
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  screenSubtitle: { color: Colors.silverMuted, fontSize: 12, marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  legendTablet: {
    paddingHorizontal: 32,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: Colors.silverMuted, fontSize: 11 },
  hintText: {
    color: Colors.silverDark,
    fontSize: 11,
    textAlign: 'center' as const,
    paddingVertical: 6,
  },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { padding: 16, paddingBottom: 40 },
  gridTablet: { paddingHorizontal: 32 },
  gridRow: { gap: 10, marginBottom: 10 },
  tableCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pulsingDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tableNumber: { fontSize: 28, fontWeight: '600' as const },
  tableStatus: {
    fontSize: 10,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  tableCapacity: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  capacityText: { color: Colors.silverDark, fontSize: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { color: Colors.white, fontSize: 16, fontWeight: '500' as const },
  emptySubtext: { color: Colors.silverMuted, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalOverlayTablet: { justifyContent: 'center', alignItems: 'center', padding: 40 },
  modalContent: {
    backgroundColor: Colors.blackRich,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  modalForm: { padding: 20, gap: 16 },
  inputGroup: { gap: 6 },
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
  detailModal: {
    backgroundColor: Colors.blackRich,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  detailBody: { padding: 20, gap: 16 },
  detailInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { color: Colors.silverMuted, fontSize: 13 },
  detailValue: { color: Colors.white, fontSize: 15, fontWeight: '500' as const },
  changeLabel: { color: Colors.goldMuted, fontSize: 10, fontWeight: '500' as const, letterSpacing: 2, marginTop: 4 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.blackCard,
  },
  statusDotSmall: { width: 6, height: 6, borderRadius: 3 },
  statusBtnText: { color: Colors.silverDark, fontSize: 13, fontWeight: '500' as const },
  detailActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  qrBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  qrBtnText: { color: Colors.gold, fontSize: 14, fontWeight: '600' as const },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 62, 62, 0.3)',
  },
  deleteBtnText: { color: Colors.red, fontSize: 14, fontWeight: '500' as const },
  qrModal: {
    backgroundColor: Colors.blackRich,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  qrBody: { padding: 20, alignItems: 'center' },
  qrLoading: { paddingVertical: 40, alignItems: 'center', gap: 12 },
  qrLoadingText: { color: Colors.silverMuted, fontSize: 13 },
  qrImageContainer: {
    width: 220,
    height: 220,
    borderRadius: 16,
    backgroundColor: Colors.white,
    padding: 16,
    marginBottom: 16,
  },
  qrImage: { width: '100%', height: '100%' },
  qrTableNumber: {
    color: Colors.gold,
    fontSize: 22,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  qrUrl: { color: Colors.silverDark, fontSize: 12, marginBottom: 16 },
  openUrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gold,
    marginBottom: 10,
  },
  openUrlText: { color: Colors.gold, fontSize: 13, fontWeight: '500' as const },
  qrErrorText: { color: Colors.silverMuted, fontSize: 14, paddingVertical: 40 },
});
