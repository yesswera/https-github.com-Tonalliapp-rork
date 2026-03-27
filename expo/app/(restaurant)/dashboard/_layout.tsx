import { Stack } from 'expo-router';
import React from 'react';
import Colors from '@/constants/colors';

export default function DashboardLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.black },
      }}
    />
  );
}
