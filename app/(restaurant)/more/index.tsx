import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Package,
  CreditCard,
  BarChart3,
  Users,
  Settings,
  ChefHat,
  Wifi,
  WifiOff,
  Bell,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useSocket } from '@/providers/SocketProvider';

interface MenuItem {
  key: string;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  route: string;
  roles: string[];
  accent?: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    key: 'kitchen',
    label: 'Vista de Cocina',
    subtitle: 'Comandas en tiempo real',
    icon: <ChefHat size={20} color={Colors.jade} />,
    route: '/(restaurant)/more/kitchen',
    roles: ['owner', 'admin', 'kitchen'],
    accent: Colors.jade,
  },
  {
    key: 'pos',
    label: 'Caja / POS',
    subtitle: 'Cobros y corte de caja',
    icon: <CreditCard size={20} color={Colors.gold} />,
    route: '/(restaurant)/more/pos',
    roles: ['owner', 'admin', 'cashier'],
    accent: Colors.gold,
  },
  {
    key: 'inventory',
    label: 'Inventario',
    subtitle: 'Control de stock',
    icon: <Package size={20} color={Colors.goldLight} />,
    route: '/(restaurant)/more/inventory',
    roles: ['owner', 'admin'],
    accent: Colors.goldLight,
  },
  {
    key: 'reports',
    label: 'Reportes',
    subtitle: 'Ventas y estadísticas',
    icon: <BarChart3 size={20} color={Colors.jadeLight} />,
    route: '/(restaurant)/more/reports',
    roles: ['owner', 'admin'],
    accent: Colors.jadeLight,
  },
  {
    key: 'users',
    label: 'Usuarios',
    subtitle: 'Equipo y permisos',
    icon: <Users size={20} color={Colors.silver} />,
    route: '/(restaurant)/more/users',
    roles: ['owner', 'admin'],
    accent: Colors.silver,
  },
  {
    key: 'settings',
    label: 'Configuración',
    subtitle: 'Datos del restaurante',
    icon: <Settings size={20} color={Colors.silverMuted} />,
    route: '/(restaurant)/more/settings',
    roles: ['owner', 'admin'],
    accent: Colors.silverMuted,
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const { user, tenant, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { isConnected, unreadCount, clearNotifications, notifications } = useSocket();

  const role = user?.role ?? 'waiter';
  const visibleItems = MENU_ITEMS.filter(item => item.roles.includes(role));

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={[styles.header, isTablet && styles.headerTablet]}>
          <Text style={styles.screenTitle}>Más</Text>
          <View style={styles.connectionBadge}>
            {isConnected ? (
              <Wifi size={14} color={Colors.jade} />
            ) : (
              <WifiOff size={14} color={Colors.red} />
            )}
            <Text style={[styles.connectionText, { color: isConnected ? Colors.jade : Colors.red }]}>
              {isConnected ? 'En línea' : 'Sin conexión'}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={[styles.scroll, isTablet && styles.scrollTablet]} showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name ?? 'Usuario'}</Text>
              <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{role.toUpperCase()}</Text>
            </View>
          </View>

          {tenant && (
            <View style={styles.tenantCard}>
              <Text style={styles.tenantName}>{tenant.name}</Text>
              <Text style={styles.tenantSlug}>tonalli.app/{tenant.slug}</Text>
            </View>
          )}

          {unreadCount > 0 && (
            <TouchableOpacity style={styles.notifBanner} onPress={clearNotifications}>
              <Bell size={16} color={Colors.gold} />
              <Text style={styles.notifText}>
                {unreadCount} notificación{unreadCount > 1 ? 'es' : ''} nueva{unreadCount > 1 ? 's' : ''}
              </Text>
              <Text style={styles.notifDismiss}>Marcar leídas</Text>
            </TouchableOpacity>
          )}

          {notifications.length > 0 && (
            <View style={styles.notifSection}>
              <Text style={styles.sectionLabel}>NOTIFICACIONES RECIENTES</Text>
              {notifications.slice(0, 5).map((notif, i) => (
                <View key={`${notif.timestamp}-${i}`} style={styles.notifItem}>
                  <View style={[
                    styles.notifDot,
                    {
                      backgroundColor:
                        notif.type === 'order_new' ? Colors.gold :
                        notif.type === 'bill_requested' ? Colors.silver :
                        notif.type === 'waiter_called' ? Colors.jade : Colors.silverDark,
                    },
                  ]} />
                  <View style={styles.notifContent}>
                    <Text style={styles.notifTitle}>{notif.title}</Text>
                    <Text style={styles.notifMsg}>{notif.message}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.sectionLabel}>HERRAMIENTAS</Text>
          <View style={styles.menuList}>
            {visibleItems.map(item => (
              <TouchableOpacity
                key={item.key}
                style={styles.menuItem}
                onPress={() => router.push(item.route as never)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBg, { backgroundColor: `${item.accent}15` }]}>
                  {item.icon}
                </View>
                <View style={styles.menuTextGroup}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <ChevronRight size={16} color={Colors.silverDark} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <LogOut size={18} color={Colors.red} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>Tonalli v1.0.0</Text>
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGold,
  },
  headerTablet: {
    paddingHorizontal: 32,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '300' as const,
    color: Colors.white,
    letterSpacing: 1,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: Colors.blackCard,
  },
  connectionText: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  scrollTablet: {
    paddingHorizontal: 32,
    maxWidth: 700,
    alignSelf: 'center' as const,
    width: '100%' as const,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blackCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.goldGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.gold,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  profileEmail: {
    color: Colors.silverMuted,
    fontSize: 12,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.statusPendingBg,
  },
  roleText: {
    color: Colors.gold,
    fontSize: 9,
    fontWeight: '600' as const,
    letterSpacing: 1,
  },
  tenantCard: {
    backgroundColor: Colors.blackCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  tenantName: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  tenantSlug: {
    color: Colors.goldMuted,
    fontSize: 11,
    marginTop: 3,
  },
  notifBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.statusPendingBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  notifText: {
    flex: 1,
    color: Colors.gold,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  notifDismiss: {
    color: Colors.goldMuted,
    fontSize: 11,
  },
  notifSection: {
    marginBottom: 16,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 10,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    color: Colors.silver,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  notifMsg: {
    color: Colors.silverDark,
    fontSize: 12,
    marginTop: 1,
  },
  sectionLabel: {
    color: Colors.goldMuted,
    fontSize: 10,
    fontWeight: '500' as const,
    letterSpacing: 2,
    marginBottom: 10,
  },
  menuList: {
    gap: 6,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blackCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  menuIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextGroup: {
    flex: 1,
    marginLeft: 12,
  },
  menuLabel: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  menuSubtitle: {
    color: Colors.silverDark,
    fontSize: 12,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 62, 62, 0.2)',
    marginBottom: 20,
  },
  logoutText: {
    color: Colors.red,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  versionText: {
    color: Colors.silverDark,
    fontSize: 11,
    textAlign: 'center' as const,
  },
});
