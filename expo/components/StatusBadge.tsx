import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import type { OrderStatus } from '@/constants/types';

const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: 'Pendiente', bg: Colors.statusPendingBg, text: Colors.gold, border: Colors.gold },
  confirmed: { label: 'Confirmado', bg: Colors.statusPendingBg, text: Colors.gold, border: Colors.gold },
  preparing: { label: 'Preparando', bg: Colors.statusPreparingBg, text: Colors.silver, border: Colors.silver },
  ready: { label: 'Listo', bg: Colors.statusReadyBg, text: Colors.jadeBright, border: Colors.jade },
  delivered: { label: 'Entregado', bg: Colors.statusReadyBg, text: Colors.jadeBright, border: Colors.jadeBright },
  paid: { label: 'Pagado', bg: Colors.statusReadyBg, text: Colors.jade, border: Colors.jade },
  cancelled: { label: 'Cancelado', bg: 'rgba(229, 62, 62, 0.12)', text: Colors.red, border: Colors.red },
};

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'small' | 'medium';
}

export default function StatusBadge({ status, size = 'small' }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.pending;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, size === 'medium' && styles.badgeMedium]}>
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text style={[styles.text, { color: config.text }, size === 'medium' && styles.textMedium]}>
        {config.label}
      </Text>
    </View>
  );
}

export function getStatusColor(status: OrderStatus): string {
  return statusConfig[status]?.border ?? Colors.gold;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  badgeMedium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  text: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  textMedium: {
    fontSize: 12,
  },
});
