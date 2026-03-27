import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://api.tonalli.app/api/v1';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export async function loadTokens() {
  try {
    accessToken = await AsyncStorage.getItem('tonalli_access_token');
    refreshToken = await AsyncStorage.getItem('tonalli_refresh_token');
  } catch (e) {
    console.log('Error loading tokens:', e);
  }
}

export async function saveTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  try {
    await AsyncStorage.setItem('tonalli_access_token', access);
    await AsyncStorage.setItem('tonalli_refresh_token', refresh);
  } catch (e) {
    console.log('Error saving tokens:', e);
  }
}

export async function clearTokens() {
  accessToken = null;
  refreshToken = null;
  try {
    await AsyncStorage.removeItem('tonalli_access_token');
    await AsyncStorage.removeItem('tonalli_refresh_token');
  } catch (e) {
    console.log('Error clearing tokens:', e);
  }
}

export function getAccessToken() {
  return accessToken;
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    console.log('[API] Refreshing access token...');
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    await saveTokens(data.accessToken, data.refreshToken);
    console.log('[API] Token refreshed successfully');
    return true;
  } catch (e) {
    console.log('[API] Token refresh failed:', e);
    return false;
  }
}

interface FetchOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  formData?: FormData;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false, formData } = options;

  const headers: Record<string, string> = {};
  if (!formData) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (formData) {
    fetchOptions.body = formData;
  } else if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  console.log(`[API] ${method} ${path}`);

  let res = await fetch(`${API_BASE}${path}`, fetchOptions);

  if (res.status === 401 && auth) {
    console.log('[API] Got 401, attempting token refresh...');
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      fetchOptions.headers = headers;
      res = await fetch(`${API_BASE}${path}`, fetchOptions);
    } else {
      throw new ApiError('Sesión expirada. Inicia sesión de nuevo.', 'SESSION_EXPIRED');
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const message = errorData?.error?.message || `Error ${res.status}`;
    const code = errorData?.error?.code || 'UNKNOWN';
    console.log(`[API] Error: ${code} - ${message}`);
    throw new ApiError(message, code);
  }

  const data = await res.json();
  console.log(`[API] Success: ${method} ${path}`);
  return data as T;
}

export class ApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}
