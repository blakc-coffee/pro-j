import { getApiBaseUrl } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

let onUnauthorizedCallback = null;
let isHandlingUnauthorized = false;

export function setOnUnauthorized(callback) {
  onUnauthorizedCallback = callback;
}

function formatApiError(data, status) {
  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (data && typeof data.detail === 'string') {
    return data.detail;
  }

  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((item) => item.msg || item.detail || JSON.stringify(item))
      .join('\n');
  }

  return `Request failed (${status})`;
}

export async function apiRequest(path, options = {}) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error(
      'API URL is not configured. Set EXPO_PUBLIC_API_URL to your computer\'s LAN address, for example http://192.168.x.x:8000.'
    );
  }
  const { headers, body, ...rest } = options;

  let response;
  let token = null;
  try {
    const stored = await AsyncStorage.getItem('plattayam.user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        token = user.access_token;
      } catch (e) {}
    }

    response = await fetch(`${baseUrl}${path}`, {
      headers: {
        Accept: 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body,
      ...rest,
    });
  } catch {
    throw new Error(
      `Could not reach ${baseUrl}. Phone and laptop must share Wi-Fi, and FastAPI must listen on 0.0.0.0:${baseUrl.split(':').pop()}.`
    );
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (response.status === 401) {
    // 401 on protected requests indicates an expired or invalid JWT token.
    // We do NOT treat unauthenticated login attempts as session expiry.
    const isLoginEndpoint = path === '/login' || path.startsWith('/auth/login') || path.startsWith('/auth/google');
    if (!isLoginEndpoint && token) {
      if (!isHandlingUnauthorized) {
        isHandlingUnauthorized = true;
        AsyncStorage.removeItem('plattayam.user').catch(() => {});
        if (typeof onUnauthorizedCallback === 'function') {
          try {
            onUnauthorizedCallback();
          } catch (e) {}
        }
        setTimeout(() => {
          isHandlingUnauthorized = false;
        }, 1000);
      }
    }
  }

  if (!response.ok) {
    throw new Error(formatApiError(data, response.status));
  }

  return data;
}
