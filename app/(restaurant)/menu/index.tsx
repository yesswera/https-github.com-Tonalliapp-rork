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
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, ChevronDown, ChevronUp, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import GoldButton from '@/components/GoldButton';
import { apiFetch } from '@/utils/api';
import type { Category } from '@/constants/types';

export default function MenuManagementScreen() {
  const queryClient = useQueryClient();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');

  const { data: categories, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiFetch<Category[]>('/categories', { auth: true }),
  });

  const addCategoryMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      apiFetch('/categories', { method: 'POST', body: data, auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowAddCategory(false);
      setCatName('');
      setCatDesc('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const addProductMutation = useMutation({
    mutationFn: (data: { categoryId: string; name: string; description: string; price: number }) =>
      apiFetch('/products', { method: 'POST', body: { ...data, available: true }, auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowAddProduct(false);
      setProdName('');
      setProdDesc('');
      setProdPrice('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const toggleAvailability = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) =>
      apiFetch(`/products/${id}/availability`, {
        method: 'PATCH',
        body: { available },
        auth: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const renderCategory = useCallback(
    ({ item }: { item: Category }) => {
      const isExpanded = expandedCategory === item.id;
      const products = item.products ?? [];

      return (
        <View style={styles.categoryCard}>
          <TouchableOpacity
            style={styles.categoryHeader}
            onPress={() => setExpandedCategory(isExpanded ? null : item.id)}
          >
            <View>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.categoryCount}>{products.length} productos</Text>
            </View>
            {isExpanded ? (
              <ChevronUp size={18} color={Colors.silverDark} />
            ) : (
              <ChevronDown size={18} color={Colors.silverDark} />
            )}
          </TouchableOpacity>

          {isExpanded && (
            <View style={styles.productsContainer}>
              {products.map(product => (
                <View key={product.id} style={styles.productRow}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>${parseFloat(product.price).toFixed(2)}</Text>
                  </View>
                  <Switch
                    value={product.available}
                    onValueChange={(val) =>
                      toggleAvailability.mutate({ id: product.id, available: val })
                    }
                    trackColor={{ false: Colors.blackElevated, true: Colors.jadeDark }}
                    thumbColor={product.available ? Colors.jadeBright : Colors.silverDark}
                  />
                </View>
              ))}
              <TouchableOpacity
                style={styles.addProductBtn}
                onPress={() => {
                  setSelectedCategoryId(item.id);
                  setShowAddProduct(true);
                }}
              >
                <Plus size={14} color={Colors.gold} />
                <Text style={styles.addProductText}>Agregar producto</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    },
    [expandedCategory, toggleAvailability]
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Menú</Text>
          <TouchableOpacity
            style={styles.addCatBtn}
            onPress={() => setShowAddCategory(true)}
          >
            <Plus size={16} color={Colors.gold} />
            <Text style={styles.addCatText}>Categoría</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.gold} size="large" />
          </View>
        ) : (
          <FlatList
            data={categories ?? []}
            renderItem={renderCategory}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.gold} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📂</Text>
                <Text style={styles.emptyText}>Sin categorías aún</Text>
                <Text style={styles.emptySubtext}>Crea tu primera categoría para empezar</Text>
              </View>
            }
          />
        )}

        <Modal visible={showAddCategory} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nueva Categoría</Text>
                <TouchableOpacity onPress={() => setShowAddCategory(false)}>
                  <X size={20} color={Colors.silverDark} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <View style={styles.modalForm}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>NOMBRE</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Ej: Entradas"
                      placeholderTextColor={Colors.silverDark}
                      value={catName}
                      onChangeText={setCatName}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>DESCRIPCIÓN</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Ej: Para abrir el apetito"
                      placeholderTextColor={Colors.silverDark}
                      value={catDesc}
                      onChangeText={setCatDesc}
                    />
                  </View>
                  <GoldButton
                    title="Crear Categoría"
                    onPress={() => addCategoryMutation.mutate({ name: catName, description: catDesc })}
                    loading={addCategoryMutation.isPending}
                    disabled={!catName.trim()}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal visible={showAddProduct} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nuevo Producto</Text>
                <TouchableOpacity onPress={() => setShowAddProduct(false)}>
                  <X size={20} color={Colors.silverDark} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <View style={styles.modalForm}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>NOMBRE</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Ej: Guacamole con Totopos"
                      placeholderTextColor={Colors.silverDark}
                      value={prodName}
                      onChangeText={setProdName}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>DESCRIPCIÓN</Text>
                    <TextInput
                      style={[styles.modalInput, { minHeight: 72 }]}
                      placeholder="Descripción del platillo"
                      placeholderTextColor={Colors.silverDark}
                      value={prodDesc}
                      onChangeText={setProdDesc}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>PRECIO (MXN)</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="89.00"
                      placeholderTextColor={Colors.silverDark}
                      value={prodPrice}
                      onChangeText={setProdPrice}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <GoldButton
                    title="Crear Producto"
                    onPress={() =>
                      addProductMutation.mutate({
                        categoryId: selectedCategoryId,
                        name: prodName,
                        description: prodDesc,
                        price: parseFloat(prodPrice) || 0,
                      })
                    }
                    loading={addProductMutation.isPending}
                    disabled={!prodName.trim() || !prodPrice.trim()}
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
    paddingBottom: 12,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '300' as const,
    color: Colors.white,
    letterSpacing: 1,
  },
  addCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  addCatText: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '500' as const,
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
  categoryCard: {
    backgroundColor: Colors.blackCard,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryName: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  categoryCount: {
    color: Colors.silverMuted,
    fontSize: 12,
    marginTop: 2,
  },
  productsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    padding: 12,
    gap: 8,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    color: Colors.silver,
    fontSize: 14,
  },
  productPrice: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  addProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addProductText: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '500' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  emptySubtext: {
    color: Colors.silverMuted,
    fontSize: 13,
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
