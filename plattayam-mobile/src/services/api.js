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

let isWarmingUp = false;

/**
 * Sends a lightweight, non-blocking background ping to wake up cold serverless instances
 * and pre-warm database connection pools on app launch.
 */
export async function warmUpServer() {
  if (isWarmingUp) return;
  isWarmingUp = true;
  try {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) return;
    await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  } catch {
    // Silently ignore background ping errors
  } finally {
    setTimeout(() => {
      isWarmingUp = false;
    }, 15000);
  }
}

function safeAtob(str) {
  if (typeof atob === 'function') {
    return atob(str);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'base64').toString('binary');
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  const clean = String(str).replace(/=+$/, '');
  for (let bc = 0, bs = 0, buffer, idx = 0; (buffer = clean.charAt(idx++)); ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4) ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)))) : 0) {
    buffer = chars.indexOf(buffer);
  }
  return output;
}

export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonStr = safeAtob(base64);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export function isTokenExpired(token, bufferSeconds = 5) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  return Date.now() >= (payload.exp * 1000 - bufferSeconds * 1000);
}

export function getTokenRemainingMs(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return null;
  const remaining = (payload.exp * 1000) - Date.now();
  return remaining > 0 ? remaining : 0;
}

export async function apiRequest(path, options = {}) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error(
      'API URL is not configured. Set EXPO_PUBLIC_API_URL to your computer\'s LAN address, for example http://192.168.x.x:8000.'
    );
  }
  const { headers, body, timeoutMs = 25000, ...rest } = options;

  let response;
  let token = null;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  const isLoginEndpoint = path === '/login' || path.startsWith('/auth/login') || path.startsWith('/auth/google');

  try {
    let stored = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        stored = window.localStorage.getItem('plattayam.user');
      } catch {}
    }
    if (!stored) {
      stored = await AsyncStorage.getItem('plattayam.user');
    }
    if (stored) {
      try {
        const user = JSON.parse(stored);
        token = user.access_token;
      } catch (e) {}
    }

    if (!isLoginEndpoint && token && isTokenExpired(token)) {
      if (!isHandlingUnauthorized) {
        isHandlingUnauthorized = true;
        AsyncStorage.removeItem('plattayam.user').catch(() => {});
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.removeItem('plattayam.user');
          } catch {}
        }
        if (typeof onUnauthorizedCallback === 'function') {
          try {
            onUnauthorizedCallback();
          } catch (e) {}
        }
        setTimeout(() => {
          isHandlingUnauthorized = false;
        }, 1000);
      }
      throw new Error('Session expired. Please sign in again.');
    }

    response = await fetch(`${baseUrl}${path}`, {
      signal: controller?.signal,
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
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Server took too long to respond. The server may still be waking up. Please try again.');
    }
    if (err?.message?.includes('Session expired')) {
      throw err;
    }
    throw new Error(
      `Could not reach ${baseUrl}. Phone and laptop must share Wi-Fi, and FastAPI must listen on 0.0.0.0:${baseUrl.split(':').pop()}.`
    );
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
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
    // 401 on protected requests indicates an expired or invalid JWT session.
    // We do NOT treat unauthenticated login attempts as session expiry.
    const isLoginEndpoint = path === '/login' || path.startsWith('/auth/login') || path.startsWith('/auth/google');
    if (!isLoginEndpoint) {
      if (!isHandlingUnauthorized) {
        isHandlingUnauthorized = true;
        AsyncStorage.removeItem('plattayam.user').catch(() => {});
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.removeItem('plattayam.user');
          } catch {}
        }
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
