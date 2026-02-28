import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import TonalliHeader from '@/components/TonalliHeader';
import ProductCard from '@/components/ProductCard';
import FloatingCartBar from '@/components/FloatingCartBar';
import { useClient } from '@/providers/ClientProvider';
import { useCart } from '@/providers/CartProvider';
import { apiFetch } from '@/utils/api';
import type { Category, Product } from '@/constants/types';

interface MenuResponse {
  restaurant: { id: string; name: string; slug: string };
  categories: Category[];
}

export default function MenuScreen() {
  const router = useRouter();
  const { slug, restaurant, tableNumber } = useClient();
  const { addItem, removeItem, getQuantity, totalItems, totalPrice } = useCart();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const categoryScrollRef = useRef<ScrollView>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['menu', slug],
    queryFn: () => apiFetch<MenuResponse>(`/menu/${slug}`),
    enabled: !!slug,
  });

  const categories = data?.categories ?? [];

  const filteredProducts = useCallback((): Product[] => {
    let products: Product[] = [];
    if (activeCategory === 'all') {
      products = categories.flatMap(c => c.products);
    } else {
      products = categories.find(c => c.id === activeCategory)?.products ?? [];
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      products = products.filter(
        p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    return products;
  }, [categories, activeCategory, searchQuery]);

  const handleAdd = useCallback((product: Product) => {
    addItem(product);
  }, [addItem]);

  const handleRemove = useCallback((productId: string) => {
    removeItem(productId);
  }, [removeItem]);

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        product={item}
        quantity={getQuantity(item.id)}
        onAdd={() => handleAdd(item)}
        onRemove={() => handleRemove(item.id)}
      />
    ),
    [getQuantity, handleAdd, handleRemove]
  );

  if (isLoading) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.gold} size="large" />
            <Text style={styles.loadingText}>Cargando menú...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TonalliHeader
          restaurantName={restaurant?.name}
          tableNumber={tableNumber}
          compact
        />

        <View style={styles.categoryBar}>
          <ScrollView
            ref={categoryScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            <TouchableOpacity
              style={[styles.pill, activeCategory === 'all' && styles.pillActive]}
              onPress={() => setActiveCategory('all')}
            >
              <Text style={[styles.pillText, activeCategory === 'all' && styles.pillTextActive]}>
                Todos
              </Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.pill, activeCategory === cat.id && styles.pillActive]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Text
                  style={[styles.pillText, activeCategory === cat.id && styles.pillTextActive]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={() => setShowSearch(!showSearch)}
            >
              {showSearch ? (
                <X size={16} color={Colors.silverMuted} />
              ) : (
                <Search size={16} color={Colors.silverMuted} />
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>

        {showSearch && (
          <View style={styles.searchBar}>
            <Search size={16} color={Colors.silverDark} />
            <View style={styles.searchInputContainer}>
              <Text
                style={[styles.searchInput, !searchQuery && styles.searchPlaceholder]}
                onPress={() => {}}
              >
                {searchQuery || 'Buscar platillos...'}
              </Text>
            </View>
          </View>
        )}

        <FlatList
          data={filteredProducts()}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.productList,
            totalItems > 0 && { paddingBottom: 100 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.gold}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🍽</Text>
              <Text style={styles.emptyText}>No hay platillos disponibles</Text>
            </View>
          }
        />

        <FloatingCartBar
          totalItems={totalItems}
          totalPrice={totalPrice}
          onPress={() => router.push('/client/cart')}
        />
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
    gap: 16,
  },
  loadingText: {
    color: Colors.silverMuted,
    fontSize: 14,
  },
  categoryBar: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.blackCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pillActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  pillText: {
    color: Colors.silverDark,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  pillTextActive: {
    color: Colors.black,
    fontWeight: '600' as const,
  },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.blackCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
  },
  searchInput: {
    color: Colors.white,
    fontSize: 14,
  },
  searchPlaceholder: {
    color: Colors.silverDark,
  },
  productList: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    color: Colors.silverMuted,
    fontSize: 15,
  },
});
