import React, { useState } from 'react';
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
import { ArrowLeft, TrendingUp, Award, Users } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiFetch } from '@/utils/api';
import type { SalesReport, TopProduct, WaiterSales } from '@/constants/types';

type Period = 'day' | 'week' | 'month';

export default function ReportsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('day');
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { data: sales, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['sales-report', period],
    queryFn: () => apiFetch<SalesReport>(`/reports/sales?period=${period}`, { auth: true }),
  });

  const { data: topProducts } = useQuery({
    queryKey: ['top-products'],
    queryFn: () => apiFetch<TopProduct[]>('/reports/top-products?limit=10', { auth: true }).catch(() => []),
  });

  const { data: waiterSales } = useQuery({
    queryKey: ['waiter-sales'],
    queryFn: () => apiFetch<WaiterSales[]>('/reports/by-waiter', { auth: true }).catch(() => []),
  });

  const topList = Array.isArray(topProducts) ? topProducts : [];
  const waiterList = Array.isArray(waiterSales) ? waiterSales : [];
  const breakdown = sales?.breakdown ?? [];
  const maxSales = Math.max(...breakdown.map(b => parseFloat(b.sales) || 0), 1);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={[styles.header, isTablet && styles.headerTablet]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={22} color={Colors.silver} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reportes</Text>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, isTablet && styles.scrollTablet]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.gold} />}
        >
          <View style={styles.periodRow}>
            {(['day', 'week', 'month'] as Period[]).map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                  {p === 'day' ? 'Hoy' : p === 'week' ? 'Semana' : 'Mes'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.gold} size="large" />
            </View>
          ) : sales ? (
            <>
              <View style={styles.summaryCards}>
                <View style={styles.summaryCard}>
                  <TrendingUp size={16} color={Colors.gold} />
                  <Text style={styles.summaryLabel}>VENTAS</Text>
                  <Text style={styles.summaryValue}>${parseFloat(sales.totalSales).toLocaleString()}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>PEDIDOS</Text>
                  <Text style={[styles.summaryValue, { color: Colors.jade }]}>{sales.totalOrders}</Text>
                </View>
              </View>

              {breakdown.length > 0 && (
                <View style={styles.chartSection}>
                  <Text style={styles.sectionLabel}>VENTAS POR HORA</Text>
                  <View style={styles.chart}>
                    {breakdown.map((item, i) => {
                      const val = parseFloat(item.sales) || 0;
                      const height = Math.max((val / maxSales) * 100, 2);
                      return (
                        <View key={i} style={styles.barWrapper}>
                          <View style={styles.barColumn}>
                            <View style={[styles.bar, { height: `${height}%` }]} />
                          </View>
                          <Text style={styles.barLabel}>{item.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </>
          ) : null}

          {topList.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Award size={16} color={Colors.gold} />
                <Text style={styles.sectionLabel}>TOP PRODUCTOS</Text>
              </View>
              {topList.map((product, i) => (
                <View key={product.productId} style={styles.topRow}>
                  <View style={styles.topRank}>
                    <Text style={styles.topRankText}>{i + 1}</Text>
                  </View>
                  <View style={styles.topInfo}>
                    <Text style={styles.topName} numberOfLines={1}>{product.productName}</Text>
                    <Text style={styles.topQty}>{product.quantity} vendidos</Text>
                  </View>
                  <Text style={styles.topRevenue}>${parseFloat(product.revenue).toFixed(0)}</Text>
                </View>
              ))}
            </View>
          )}

          {waiterList.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Users size={16} color={Colors.jade} />
                <Text style={styles.sectionLabel}>VENTAS POR MESERO</Text>
              </View>
              {waiterList.map(waiter => (
                <View key={waiter.userId} style={styles.waiterRow}>
                  <View style={styles.waiterAvatar}>
                    <Text style={styles.waiterInitial}>{waiter.userName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.waiterInfo}>
                    <Text style={styles.waiterName}>{waiter.userName}</Text>
                    <Text style={styles.waiterOrders}>{waiter.orders} pedidos</Text>
                  </View>
                  <Text style={styles.waiterSales}>${parseFloat(waiter.sales).toFixed(0)}</Text>
                </View>
              ))}
            </View>
          )}
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
  scroll: { padding: 20, paddingBottom: 40 },
  scrollTablet: { paddingHorizontal: 32, maxWidth: 800, alignSelf: 'center' as const, width: '100%' as const },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.blackCard,
  },
  periodBtnActive: { backgroundColor: Colors.gold },
  periodText: { color: Colors.silverDark, fontSize: 13, fontWeight: '500' as const },
  periodTextActive: { color: Colors.black, fontWeight: '600' as const },
  loadingContainer: { paddingVertical: 60, alignItems: 'center' },
  summaryCards: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.blackCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 6,
  },
  summaryLabel: { color: Colors.silverMuted, fontSize: 9, fontWeight: '500' as const, letterSpacing: 1.5 },
  summaryValue: { color: Colors.gold, fontSize: 24, fontWeight: '600' as const },
  chartSection: { marginBottom: 24 },
  sectionLabel: { color: Colors.goldMuted, fontSize: 10, fontWeight: '500' as const, letterSpacing: 2, marginBottom: 12 },
  chart: {
    flexDirection: 'row',
    backgroundColor: Colors.blackCard,
    borderRadius: 14,
    padding: 16,
    paddingBottom: 8,
    height: 180,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  barWrapper: { flex: 1, alignItems: 'center' },
  barColumn: { flex: 1, width: '60%', justifyContent: 'flex-end' },
  bar: { backgroundColor: Colors.gold, borderRadius: 3, minHeight: 2, width: '100%' },
  barLabel: { color: Colors.silverDark, fontSize: 8, marginTop: 6, textAlign: 'center' as const },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blackCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  topRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.goldGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRankText: { color: Colors.gold, fontSize: 13, fontWeight: '700' as const },
  topInfo: { flex: 1, marginLeft: 12 },
  topName: { color: Colors.white, fontSize: 14, fontWeight: '500' as const },
  topQty: { color: Colors.silverDark, fontSize: 11, marginTop: 2 },
  topRevenue: { color: Colors.gold, fontSize: 15, fontWeight: '600' as const },
  waiterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blackCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  waiterAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.jadeGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waiterInitial: { color: Colors.jade, fontSize: 14, fontWeight: '600' as const },
  waiterInfo: { flex: 1, marginLeft: 12 },
  waiterName: { color: Colors.white, fontSize: 14, fontWeight: '500' as const },
  waiterOrders: { color: Colors.silverDark, fontSize: 11, marginTop: 2 },
  waiterSales: { color: Colors.jade, fontSize: 15, fontWeight: '600' as const },
});
