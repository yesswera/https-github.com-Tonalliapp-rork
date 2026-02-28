import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Store } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import GoldButton from '@/components/GoldButton';
import { apiFetch } from '@/utils/api';
import type { Restaurant } from '@/constants/types';

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [currency, setCurrency] = useState('MXN');

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: () => apiFetch<Restaurant>('/tenants/me', { auth: true }),
  });

  useEffect(() => {
    if (tenant) {
      setName(tenant.name || '');
      setAddress(tenant.config?.address || '');
      setPhone(tenant.config?.phone || '');
      setCurrency(tenant.config?.currency || 'MXN');
    }
  }, [tenant]);

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; config: { address: string; phone: string; currency: string } }) =>
      apiFetch('/tenants/me', { method: 'PUT', body: data, auth: true }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
      Alert.alert('Guardado', 'La configuración se actualizó correctamente');
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  if (isLoading) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.gold} size="large" />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={[styles.header, isTablet && styles.headerTablet]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={22} color={Colors.silver} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configuración</Text>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, isTablet && styles.scrollTablet]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoSection}>
            <View style={styles.logoPlaceholder}>
              {tenant?.logoUrl ? (
                <Store size={32} color={Colors.gold} />
              ) : (
                <Store size={32} color={Colors.silverDark} />
              )}
            </View>
            <Text style={styles.logoHint}>El logo se usa en los QR personalizados</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NOMBRE DEL RESTAURANTE</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Mi Restaurante"
                placeholderTextColor={Colors.silverDark}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>DIRECCIÓN</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Calle, Ciudad, Estado"
                placeholderTextColor={Colors.silverDark}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>TELÉFONO</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="3221234567"
                placeholderTextColor={Colors.silverDark}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MONEDA</Text>
              <TextInput
                style={styles.input}
                value={currency}
                onChangeText={setCurrency}
                placeholder="MXN"
                placeholderTextColor={Colors.silverDark}
              />
            </View>

            {tenant?.slug && (
              <View style={styles.slugCard}>
                <Text style={styles.slugLabel}>URL DEL MENÚ</Text>
                <Text style={styles.slugValue}>menu.tonalli.app/{tenant.slug}</Text>
              </View>
            )}

            <GoldButton
              title="Guardar Cambios"
              onPress={() =>
                updateMutation.mutate({
                  name: name.trim(),
                  config: {
                    address: address.trim(),
                    phone: phone.trim(),
                    currency: currency.trim() || 'MXN',
                  },
                })
              }
              loading={updateMutation.isPending}
              disabled={!name.trim()}
              style={{ marginTop: 8 }}
            />
          </View>
        </ScrollView>
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
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  scrollTablet: { paddingHorizontal: 32, maxWidth: 560, alignSelf: 'center' as const, width: '100%' as const },
  logoSection: { alignItems: 'center', marginBottom: 28 },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.blackCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.borderGold,
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  logoHint: { color: Colors.silverDark, fontSize: 12 },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  inputLabel: { color: Colors.goldMuted, fontSize: 10, fontWeight: '500' as const, letterSpacing: 2 },
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
  slugCard: {
    backgroundColor: Colors.blackCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  slugLabel: { color: Colors.goldMuted, fontSize: 10, fontWeight: '500' as const, letterSpacing: 2, marginBottom: 6 },
  slugValue: { color: Colors.gold, fontSize: 14, fontWeight: '500' as const },
});
