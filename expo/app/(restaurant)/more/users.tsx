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
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, X, Shield } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import GoldButton from '@/components/GoldButton';
import { apiFetch } from '@/utils/api';
import type { User } from '@/constants/types';

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  owner: { label: 'Dueño', color: Colors.gold, bg: Colors.statusPendingBg },
  admin: { label: 'Admin', color: Colors.goldLight, bg: 'rgba(226, 201, 126, 0.12)' },
  cashier: { label: 'Cajero', color: Colors.silver, bg: Colors.statusPreparingBg },
  waiter: { label: 'Mesero', color: Colors.jadeLight, bg: Colors.jadeGlow },
  kitchen: { label: 'Cocina', color: Colors.jadeBright, bg: 'rgba(114, 191, 150, 0.12)' },
};

const AVAILABLE_ROLES = ['admin', 'cashier', 'waiter', 'kitchen'] as const;

export default function UsersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('waiter');

  const { data: users, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiFetch<User[]>('/users', { auth: true }),
  });

  const addMutation = useMutation({
    mutationFn: (data: { name: string; email: string; password: string; role: string }) =>
      apiFetch('/users', { method: 'POST', body: data, auth: true }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowAdd(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('waiter');
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiFetch(`/users/${id}`, { method: 'PUT', body: { active }, auth: true }),
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const usersList = Array.isArray(users) ? users : [];

  const renderUser = useCallback(({ item }: { item: User }) => {
    const config = ROLE_CONFIG[item.role] ?? ROLE_CONFIG.waiter;
    const isOwner = item.role === 'owner';

    return (
      <View style={styles.userCard}>
        <View style={styles.userAvatar}>
          <Text style={styles.userInitial}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={styles.userRight}>
          <View style={[styles.userRoleBadge, { backgroundColor: config.bg }]}>
            <Text style={[styles.userRoleText, { color: config.color }]}>{config.label}</Text>
          </View>
          {!isOwner && (
            <Switch
              value={item.active !== false}
              onValueChange={(val) => toggleMutation.mutate({ id: item.id, active: val })}
              trackColor={{ false: Colors.blackElevated, true: Colors.jadeDark }}
              thumbColor={item.active !== false ? Colors.jadeBright : Colors.silverDark}
            />
          )}
        </View>
      </View>
    );
  }, [toggleMutation]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={[styles.header, isTablet && styles.headerTablet]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={22} color={Colors.silver} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Usuarios</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
            <Plus size={16} color={Colors.gold} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.gold} size="large" />
          </View>
        ) : (
          <FlatList
            data={usersList}
            renderItem={renderUser}
            keyExtractor={item => item.id}
            contentContainerStyle={[styles.list, isTablet && styles.listTablet]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.gold} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Shield size={40} color={Colors.silverDark} />
                <Text style={styles.emptyText}>Sin usuarios adicionales</Text>
              </View>
            }
          />
        )}

        <Modal visible={showAdd} transparent animationType="slide">
          <View style={[styles.modalOverlay, isTablet && styles.modalOverlayTablet]}>
            <View style={[styles.modalContent, isTablet && styles.modalContentTablet]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nuevo Usuario</Text>
                <TouchableOpacity onPress={() => setShowAdd(false)}>
                  <X size={20} color={Colors.silverDark} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <View style={styles.modalForm}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>NOMBRE</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={name}
                      onChangeText={setName}
                      placeholder="Ana García"
                      placeholderTextColor={Colors.silverDark}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>EMAIL</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="ana@correo.com"
                      placeholderTextColor={Colors.silverDark}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>CONTRASEÑA</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Mínimo 8 caracteres"
                      placeholderTextColor={Colors.silverDark}
                      secureTextEntry
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>ROL</Text>
                    <View style={styles.roleRow}>
                      {AVAILABLE_ROLES.map(r => {
                        const cfg = ROLE_CONFIG[r];
                        return (
                          <TouchableOpacity
                            key={r}
                            style={[styles.roleBtn, role === r && { borderColor: cfg.color, backgroundColor: cfg.bg }]}
                            onPress={() => setRole(r)}
                          >
                            <Text style={[styles.roleBtnText, role === r && { color: cfg.color }]}>
                              {cfg.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                  <GoldButton
                    title="Crear Usuario"
                    onPress={() => addMutation.mutate({ name, email, password, role })}
                    loading={addMutation.isPending}
                    disabled={!name.trim() || !email.trim() || !password.trim()}
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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  listTablet: { paddingHorizontal: 32, maxWidth: 700, alignSelf: 'center' as const, width: '100%' as const },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blackCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.blackSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitial: { color: Colors.silver, fontSize: 16, fontWeight: '600' as const },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { color: Colors.white, fontSize: 15, fontWeight: '500' as const },
  userEmail: { color: Colors.silverDark, fontSize: 12, marginTop: 2 },
  userRight: { alignItems: 'flex-end', gap: 6 },
  userRoleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  userRoleText: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.5 },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { color: Colors.silverMuted, fontSize: 14 },
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
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.blackCard,
  },
  roleBtnText: { color: Colors.silverDark, fontSize: 13, fontWeight: '500' as const },
});
