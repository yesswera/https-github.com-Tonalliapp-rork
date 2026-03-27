import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { apiFetch, saveTokens, clearTokens, loadTokens } from '@/utils/api';
import type { User, AuthResponse } from '@/constants/types';

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    (async () => {
      try {
        await loadTokens();
        const storedUser = await AsyncStorage.getItem('tonalli_user');
        const storedTenant = await AsyncStorage.getItem('tonalli_tenant');
        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedTenant) setTenant(JSON.parse(storedTenant));
      } catch (e) {
        console.log('[Auth] Error loading stored auth:', e);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const handleAuthSuccess = useCallback(async (data: AuthResponse) => {
    await saveTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    setTenant(data.tenant);
    await AsyncStorage.setItem('tonalli_user', JSON.stringify(data.user));
    await AsyncStorage.setItem('tonalli_tenant', JSON.stringify(data.tenant));
    console.log('[Auth] Login success:', data.user.email, data.user.role);
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (creds: { email: string; password: string }) => {
      return apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: creds,
      });
    },
    onSuccess: handleAuthSuccess,
  });

  const registerMutation = useMutation({
    mutationFn: async (data: {
      restaurantName: string;
      ownerName: string;
      email: string;
      password: string;
      phone?: string;
      address?: string;
    }) => {
      return apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: handleAuthSuccess,
  });

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: { refreshToken: await AsyncStorage.getItem('tonalli_refresh_token') },
        auth: true,
      });
    } catch (e) {
      console.log('[Auth] Logout API call failed (continuing anyway):', e);
    }
    await clearTokens();
    await AsyncStorage.removeItem('tonalli_user');
    await AsyncStorage.removeItem('tonalli_tenant');
    setUser(null);
    setTenant(null);
    queryClient.clear();
    console.log('[Auth] Logged out');
  }, [queryClient]);

  return {
    user,
    tenant,
    isReady,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error?.message ?? null,
    register: registerMutation.mutateAsync,
    registerLoading: registerMutation.isPending,
    registerError: registerMutation.error?.message ?? null,
    logout,
  };
});
