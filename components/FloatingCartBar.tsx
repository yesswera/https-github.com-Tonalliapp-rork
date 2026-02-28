import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingBag, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface FloatingCartBarProps {
  totalItems: number;
  totalPrice: number;
  onPress: () => void;
  currency?: string;
}

export default function FloatingCartBar({ totalItems, totalPrice, onPress, currency = 'MXN' }: FloatingCartBarProps) {
  const slideUp = useRef(new Animated.Value(100)).current;
  const itemScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (totalItems > 0) {
      Animated.spring(slideUp, {
        toValue: 0,
        useNativeDriver: true,
        speed: 12,
        bounciness: 8,
      }).start();
    } else {
      Animated.timing(slideUp, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [totalItems, slideUp]);

  useEffect(() => {
    if (totalItems > 0) {
      Animated.sequence([
        Animated.timing(itemScale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
        Animated.spring(itemScale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 10 }),
      ]).start();
    }
  }, [totalItems, itemScale]);

  if (totalItems === 0) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideUp }] }]}>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[Colors.gold, Colors.goldDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bar}
        >
          <View style={styles.left}>
            <View style={styles.bagContainer}>
              <ShoppingBag size={18} color={Colors.black} />
              <Animated.View style={[styles.badge, { transform: [{ scale: itemScale }] }]}>
                <Text style={styles.badgeText}>{totalItems}</Text>
              </Animated.View>
            </View>
            <Text style={styles.label}>Ver pedido</Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.total}>${totalPrice.toFixed(2)}</Text>
            <ChevronRight size={18} color={Colors.black} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bagContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -10,
    backgroundColor: Colors.black,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: '700' as const,
  },
  label: {
    color: Colors.black,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  total: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
