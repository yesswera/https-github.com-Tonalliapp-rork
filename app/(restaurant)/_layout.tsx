import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, ClipboardList, UtensilsCrossed, Grid3X3 } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function RestaurantLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.blackRich,
          borderTopColor: Colors.borderGold,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.silverDark,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500' as const,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menú',
          tabBarIcon: ({ color, size }) => <UtensilsCrossed size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tables"
        options={{
          title: 'Mesas',
          tabBarIcon: ({ color, size }) => <Grid3X3 size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
