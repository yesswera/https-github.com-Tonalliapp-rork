import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScanLine } from 'lucide-react-native';
import Colors from '@/constants/colors';
import GoldButton from '@/components/GoldButton';
import { apiFetch } from '@/utils/api';
import { useClient } from '@/providers/ClientProvider';
import type { Restaurant, Table } from '@/constants/types';

interface TableResponse {
  restaurant: Restaurant;
  table: Table;
}

export default function ClientEntry() {
  const router = useRouter();
  const { setRestaurantInfo } = useClient();
  const [slug, setSlug] = useState('');
  const [tableNumber, setTableNumber] = useState('');

  const sunScale = useRef(new Animated.Value(0.8)).current;
  const sunOpacity = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const formSlide = useRef(new Animated.Value(40)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(sunScale, { toValue: 1, useNativeDriver: true, speed: 4, bounciness: 6 }),
      Animated.timing(sunOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(formSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(formOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }, 500);
  }, []);

  const fetchTableMutation = useMutation({
    mutationFn: async () => {
      const mesa = parseInt(tableNumber, 10);
      if (!slug.trim() || isNaN(mesa)) {
        throw new Error('Ingresa el restaurante y número de mesa');
      }
      return apiFetch<TableResponse>(`/menu/${slug.trim()}/table/${mesa}`);
    },
    onSuccess: (data) => {
      setRestaurantInfo(data.restaurant, data.table, slug.trim());
      router.push('/client/menu');
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message);
    },
  });

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroSection}>
              <Animated.View
                style={[
                  styles.sunContainer,
                  {
                    transform: [{ scale: sunScale }],
                    opacity: sunOpacity,
                  },
                ]}
              >
                <Animated.View style={[styles.sunGlow, { opacity: glowAnim }]} />
                <View style={styles.sunCore} />
                <View style={styles.sunRing} />
                <View style={styles.sunRingOuter} />
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
                  <View
                    key={angle}
                    style={[
                      styles.ray,
                      {
                        transform: [{ rotate: `${angle}deg` }, { translateY: -38 }],
                      },
                    ]}
                  />
                ))}
                {[45, 135, 225, 315].map((angle) => (
                  <View
                    key={`jade-${angle}`}
                    style={[
                      styles.jadeAccent,
                      {
                        transform: [{ rotate: `${angle}deg` }, { translateY: -30 }],
                      },
                    ]}
                  />
                ))}
              </Animated.View>

              <Text style={styles.logo}>TONALLI</Text>
              <View style={styles.dividerLine} />
              <Text style={styles.tagline}>
                ENERGÍA <Text style={styles.taglineVital}>VITAL</Text> EN CADA MESA
              </Text>
            </View>

            <Animated.View
              style={[
                styles.formSection,
                {
                  transform: [{ translateY: formSlide }],
                  opacity: formOpacity,
                },
              ]}
            >
              <View style={styles.scanHint}>
                <ScanLine size={16} color={Colors.silverMuted} />
                <Text style={styles.scanText}>Ingresa los datos de tu mesa</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>RESTAURANTE</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ej: la-cocina-de-maria"
                  placeholderTextColor={Colors.silverDark}
                  value={slug}
                  onChangeText={setSlug}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="client-slug-input"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NÚMERO DE MESA</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ej: 7"
                  placeholderTextColor={Colors.silverDark}
                  value={tableNumber}
                  onChangeText={setTableNumber}
                  keyboardType="number-pad"
                  testID="client-table-input"
                />
              </View>

              <GoldButton
                title="Ver Menú"
                onPress={() => fetchTableMutation.mutate()}
                loading={fetchTableMutation.isPending}
                disabled={!slug.trim() || !tableNumber.trim()}
                style={styles.button}
              />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sunContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  sunGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.goldGlow,
  },
  sunCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.goldLight,
    shadowColor: Colors.goldLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  sunRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    opacity: 0.6,
  },
  sunRingOuter: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: Colors.jadeMuted,
    opacity: 0.3,
  },
  ray: {
    position: 'absolute',
    width: 2,
    height: 10,
    backgroundColor: Colors.gold,
    borderRadius: 1,
    opacity: 0.7,
  },
  jadeAccent: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.jade,
    opacity: 0.8,
  },
  logo: {
    fontSize: 42,
    fontWeight: '300' as const,
    color: Colors.gold,
    letterSpacing: 12,
  },
  dividerLine: {
    width: 80,
    height: 1,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: Colors.jadeMuted,
    opacity: 0.5,
  },
  tagline: {
    fontSize: 10,
    color: Colors.silverMuted,
    letterSpacing: 4,
    textTransform: 'uppercase' as const,
  },
  taglineVital: {
    color: Colors.jadeLight,
    fontWeight: '700' as const,
  },
  formSection: {
    gap: 16,
  },
  scanHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  scanText: {
    color: Colors.silverMuted,
    fontSize: 13,
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
  input: {
    backgroundColor: Colors.blackCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.white,
    fontSize: 15,
  },
  button: {
    marginTop: 8,
  },
});
