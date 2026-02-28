import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

interface TonalliHeaderProps {
  restaurantName?: string;
  tableNumber?: number;
  compact?: boolean;
}

export default function TonalliHeader({ restaurantName, tableNumber, compact = false }: TonalliHeaderProps) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <Text style={[styles.logo, compact && styles.logoCompact]}>TONALLI</Text>
      {restaurantName && (
        <Text style={styles.restaurantName}>{restaurantName}</Text>
      )}
      <View style={styles.divider} />
      {tableNumber !== undefined && (
        <View style={styles.tableBadge}>
          <Text style={styles.tableText}>Mesa {tableNumber}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGold,
  },
  compact: {
    paddingVertical: 10,
  },
  logo: {
    fontSize: 24,
    fontWeight: '300' as const,
    color: Colors.gold,
    letterSpacing: 6,
  },
  logoCompact: {
    fontSize: 18,
    letterSpacing: 4,
  },
  restaurantName: {
    fontSize: 12,
    color: Colors.silverMuted,
    marginTop: 4,
    letterSpacing: 1,
  },
  divider: {
    width: 60,
    height: 1,
    marginTop: 8,
    backgroundColor: Colors.jadeMuted,
    opacity: 0.5,
  },
  tableBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.tableBorderJade,
    backgroundColor: Colors.tableBgJade,
  },
  tableText: {
    color: Colors.jadeLight,
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
});
