import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TrendingUp,
  ShoppingBag,
  Receipt,
  ChefHat,
  LogOut,
  ClipboardList,
  Grid3X3,
  UtensilsCrossed,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { apiFetch } from '@/utils/api';
import type { DashboardData } from '@/constants/types';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, tenant, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiFetch<DashboardData>('/reports/dashboard', { auth: true }),
    refetchInterval: 30000,
  });

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/');
  }, [logout, router]);

  const formatCurrency = (val: string) => {
    const num = parseFloat(val);
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
    return `$${num.toFixed(0)}`;
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={[styles.header, isTablet && styles.headerTablet]}>
          <View>
            <Text style={styles.logo}>TONALLI</Text>
            <Text style={styles.restaurantName}>{tenant?.name ?? 'Mi Restaurante'}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <LogOut size={18} color={Colors.silverDark} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, isTablet && styles.scrollTablet]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.gold} />
          }
        >
          <Text style={styles.greeting}>
            Hola, {user?.name?.split(' ')[0] ?? 'Usuario'} 👋
          </Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.gold} size="large" />
            </View>
          ) : data ? (
            <>
              {isTablet ? (
                <View style={styles.tabletTopRow}>
                  <View style={[styles.salesCard, styles.tabletSalesCard]}>
                    <View style={styles.metricIcon}>
                      <TrendingUp size={18} color={Colors.gold} />
                    </View>
                    <Text style={styles.metricLabel}>VENTAS HOY</Text>
                    <Text style={styles.salesValue}>{formatCurrency(data.today.sales)}</Text>
                  </View>
                  <View style={styles.tabletMetricsColumn}>
                    <View style={styles.metricsRow}>
                      <View style={styles.metricCard}>
                        <View style={[styles.metricIconSmall, { backgroundColor: Colors.jadeGlow }]}>
                          <ShoppingBag size={14} color={Colors.jade} />
                        </View>
                        <Text style={styles.metricLabel}>PEDIDOS</Text>
                        <Text style={styles.metricValue}>{data.today.orders}</Text>
                      </View>
                      <View style={styles.metricCard}>
                        <View style={[styles.metricIconSmall, { backgroundColor: Colors.statusPreparingBg }]}>
                          <Receipt size={14} color={Colors.silver} />
                        </View>
                        <Text style={styles.metricLabel}>TICKET PROM.</Text>
                        <Text style={styles.metricValue}>{formatCurrency(data.today.averageTicket)}</Text>
                      </View>
                      <View style={styles.metricCard}>
                        <View style={[styles.metricIconSmall, { backgroundColor: Colors.goldGlow }]}>
                          <ChefHat size={14} color={Colors.goldLight} />
                        </View>
                        <Text style={styles.metricLabel}>PLATILLOS</Text>
                        <Text style={styles.metricValue}>{data.today.itemsSold}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.salesCard}>
                    <View style={styles.metricIcon}>
                      <TrendingUp size={18} color={Colors.gold} />
                    </View>
                    <Text style={styles.metricLabel}>VENTAS HOY</Text>
                    <Text style={styles.salesValue}>{formatCurrency(data.today.sales)}</Text>
                  </View>

                  <View style={styles.metricsRow}>
                    <View style={styles.metricCard}>
                      <View style={[styles.metricIconSmall, { backgroundColor: Colors.jadeGlow }]}>
                        <ShoppingBag size={14} color={Colors.jade} />
                      </View>
                      <Text style={styles.metricLabel}>PEDIDOS</Text>
                      <Text style={styles.metricValue}>{data.today.orders}</Text>
                    </View>
                    <View style={styles.metricCard}>
                      <View style={[styles.metricIconSmall, { backgroundColor: Colors.statusPreparingBg }]}>
                        <Receipt size={14} color={Colors.silver} />
                      </View>
                      <Text style={styles.metricLabel}>TICKET PROM.</Text>
                      <Text style={styles.metricValue}>{formatCurrency(data.today.averageTicket)}</Text>
                    </View>
                    <View style={styles.metricCard}>
                      <View style={[styles.metricIconSmall, { backgroundColor: Colors.goldGlow }]}>
                        <ChefHat size={14} color={Colors.goldLight} />
                      </View>
                      <Text style={styles.metricLabel}>PLATILLOS</Text>
                      <Text style={styles.metricValue}>{data.today.itemsSold}</Text>
                    </View>
                  </View>
                </>
              )}

              <View style={styles.statusRow}>
                <View style={styles.statusCard}>
                  <Text style={styles.statusNumber}>{data.activeOrders}</Text>
                  <Text style={styles.statusLabel}>Pedidos activos</Text>
                </View>
                <View style={styles.statusDivider} />
                <View style={styles.statusCard}>
                  <Text style={[styles.statusNumber, { color: Colors.jadeLight }]}>
                    {data.tablesOccupied}
                  </Text>
                  <Text style={styles.statusLabel}>
                    de {data.totalTables} mesas
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>ACCESOS RÁPIDOS</Text>
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => router.push('/(restaurant)/orders')}
                >
                  <ClipboardList size={20} color={Colors.gold} />
                  <Text style={styles.quickActionText}>Pedidos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => router.push('/(restaurant)/tables')}
                >
                  <Grid3X3 size={20} color={Colors.jade} />
                  <Text style={styles.quickActionText}>Mesas</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => router.push('/(restaurant)/menu')}
                >
                  <UtensilsCrossed size={20} color={Colors.silver} />
                  <Text style={styles.quickActionText}>Menú</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.errorText}>No se pudieron cargar los datos</Text>
              <TouchableOpacity onPress={() => refetch()}>
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGold,
  },
  headerTablet: {
    paddingHorizontal: 32,
  },
  logo: {
    fontSize: 18,
    fontWeight: '300' as const,
    color: Colors.gold,
    letterSpacing: 4,
  },
  restaurantName: {
    fontSize: 11,
    color: Colors.silverMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.statusPendingBg,
  },
  roleText: {
    color: Colors.gold,
    fontSize: 9,
    fontWeight: '600' as const,
    letterSpacing: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  scrollTablet: {
    paddingHorizontal: 32,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '300' as const,
    color: Colors.white,
    marginBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  salesCard: {
    backgroundColor: Colors.blackCard,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 12,
  },
  tabletTopRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  tabletSalesCard: {
    flex: 1,
    marginBottom: 0,
  },
  tabletMetricsColumn: {
    flex: 2,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.goldGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  salesValue: {
    color: Colors.gold,
    fontSize: 36,
    fontWeight: '600' as const,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.blackCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  metricIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    color: Colors.silverMuted,
    fontSize: 9,
    fontWeight: '500' as const,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  metricValue: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '600' as const,
  },
  statusRow: {
    flexDirection: 'row',
    backgroundColor: Colors.blackCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  statusCard: {
    flex: 1,
    alignItems: 'center',
  },
  statusDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
  },
  statusNumber: {
    fontSize: 28,
    fontWeight: '600' as const,
    color: Colors.gold,
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.silverMuted,
    marginTop: 4,
  },
  sectionLabel: {
    color: Colors.goldMuted,
    fontSize: 10,
    fontWeight: '500' as const,
    letterSpacing: 2,
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    backgroundColor: Colors.blackCard,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  quickActionText: {
    color: Colors.silver,
    fontSize: 12,
    fontWeight: '500' as const,
  },
  errorText: {
    color: Colors.silverMuted,
    fontSize: 14,
  },
  retryText: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: '500' as const,
  },
});
