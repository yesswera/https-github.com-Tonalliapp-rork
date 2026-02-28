import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import GoldButton from '@/components/GoldButton';
import { apiFetch } from '@/utils/api';
import type { Table } from '@/constants/types';

const TABLE_STATUS_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  free: { bg: Colors.blackCard, border: Colors.borderLight, text: Colors.silverDark, label: 'Libre' },
  occupied: { bg: 'rgba(201, 168, 76, 0.08)', border: Colors.gold, text: Colors.gold, label: 'Ocupada' },
  ordering: { bg: Colors.tableBgJade, border: Colors.jade, text: Colors.jadeLight, label: 'Pidiendo' },
  bill: { bg: Colors.statusPreparingBg, border: Colors.silver, text: Colors.silver, label: 'Cuenta' },
};

export default function TablesScreen() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
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

  const handleTablePress = useCallback((table: Table) => {
    const statuses = ['free', 'occupied', 'ordering', 'bill'] as const;
    Alert.alert(
      `Mesa ${table.number}`,
      `Estado: ${TABLE_STATUS_COLORS[table.status]?.label}\nCapacidad: ${table.capacity}`,
      [
        ...statuses
          .filter(s => s !== table.status)
          .map(s => ({
            text: TABLE_STATUS_COLORS[s].label,
            onPress: () => updateStatusMutation.mutate({ id: table.id, status: s }),
          })),
        { text: 'Cancelar', style: 'cancel' as const },
      ]
    );
  }, [updateStatusMutation]);

  const renderTable = useCallback(
    ({ item }: { item: Table }) => {
      const config = TABLE_STATUS_COLORS[item.status] ?? TABLE_STATUS_COLORS.free;
      return (
        <TouchableOpacity
          style={[styles.tableCard, { backgroundColor: config.bg, borderColor: config.border }]}
          onPress={() => handleTablePress(item)}
          activeOpacity={0.7}
        >
          <Text style={[styles.tableNumber, { color: config.text }]}>{item.number}</Text>
          <Text style={[styles.tableStatus, { color: config.text }]}>{config.label}</Text>
          <View style={styles.tableCapacity}>
            <Users size={10} color={Colors.silverDark} />
            <Text style={styles.capacityText}>{item.capacity}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handleTablePress]
  );

  const sortedTables = (tables ?? []).sort((a, b) => a.number - b.number);
  const freeCount = sortedTables.filter(t => t.status === 'free').length;
  const occupiedCount = sortedTables.filter(t => t.status !== 'free').length;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.screenHeader}>
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

        <View style={styles.legend}>
          {Object.entries(TABLE_STATUS_COLORS).map(([key, val]) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: val.text }]} />
              <Text style={styles.legendText}>{val.label}</Text>
            </View>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.gold} size="large" />
          </View>
        ) : (
          <FlatList
            data={sortedTables}
            renderItem={renderTable}
            keyExtractor={item => item.id}
            numColumns={3}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.gold} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🪑</Text>
                <Text style={styles.emptyText}>Sin mesas configuradas</Text>
              </View>
            }
          />
        )}

        <Modal visible={showAdd} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '300' as const,
    color: Colors.white,
    letterSpacing: 1,
  },
  screenSubtitle: {
    color: Colors.silverMuted,
    fontSize: 12,
    marginTop: 2,
  },
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
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: Colors.silverMuted,
    fontSize: 11,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    padding: 16,
    paddingBottom: 40,
  },
  gridRow: {
    gap: 10,
    marginBottom: 10,
  },
  tableCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tableNumber: {
    fontSize: 28,
    fontWeight: '600' as const,
  },
  tableStatus: {
    fontSize: 10,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  tableCapacity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  capacityText: {
    color: Colors.silverDark,
    fontSize: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
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
  modalTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '500' as const,
  },
  modalForm: {
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: Colors.goldMuted,
    fontSize: 10,
    fontWeight: '500' as const,
    letterSpacing: 2,
  },
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
