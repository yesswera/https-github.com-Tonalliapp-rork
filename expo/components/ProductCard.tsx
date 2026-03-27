import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Plus, Minus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import type { Product } from '@/constants/types';

interface ProductCardProps {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export default React.memo(function ProductCard({ product, quantity, onAdd, onRemove }: ProductCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handleAdd = useCallback(() => {
    if (!product.available) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 6 }),
    ]).start();
    onAdd();
  }, [product.available, onAdd, scale]);

  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toFixed(0)}`;
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }, !product.available && styles.unavailable]}>
      <TouchableOpacity
        onPress={handleAdd}
        activeOpacity={0.8}
        disabled={!product.available}
        style={styles.cardInner}
      >
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderEmoji}>🍽</Text>
          </View>
        )}
        <View style={styles.content}>
          <View style={styles.textContent}>
            <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
            <Text style={styles.description} numberOfLines={2}>{product.description}</Text>
            <View style={styles.bottomRow}>
              <Text style={styles.price}>{formatPrice(product.price)}</Text>
              {product.available ? (
                <View style={styles.availableDot}>
                  <View style={styles.dot} />
                </View>
              ) : (
                <Text style={styles.unavailableText}>No disponible</Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
      {quantity > 0 && (
        <View style={styles.quantityControls}>
          <TouchableOpacity onPress={onRemove} style={styles.quantityBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Minus size={14} color={Colors.gold} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity onPress={handleAdd} style={styles.quantityBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Plus size={14} color={Colors.gold} />
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.blackCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardInner: {
    flexDirection: 'row',
    padding: 12,
  },
  unavailable: {
    opacity: 0.5,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: Colors.blackSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 28,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  textContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 3,
  },
  description: {
    color: Colors.silverDark,
    fontSize: 12,
    fontWeight: '300' as const,
    lineHeight: 16,
    marginBottom: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    color: Colors.gold,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  availableDot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.jadeLight,
  },
  unavailableText: {
    color: Colors.red,
    fontSize: 10,
    fontWeight: '500' as const,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 16,
  },
  quantityBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    color: Colors.gold,
    fontSize: 16,
    fontWeight: '600' as const,
    minWidth: 20,
    textAlign: 'center' as const,
  },
});
