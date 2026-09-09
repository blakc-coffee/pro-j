import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getTokenRemainingMs, isTokenExpired, setOnUnauthorized } from '../services/api';
import { loginRequest } from '../services/auth';

const STORAGE_KEY = 'plattayam.user';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    setUser(null);
  }, []);

  useEffect(() => {
    // Register centralized unauthorized/expired token handler
    setOnUnauthorized(() => {
      logout();
    });
  }, [logout]);

  useEffect(() => {
    async function restoreUser() {
      try {
        let stored = null;
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            stored = window.localStorage.getItem(STORAGE_KEY);
          } catch {}
        }
        if (!stored) {
          stored = await AsyncStorage.getItem(STORAGE_KEY);
        }
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.access_token && isTokenExpired(parsed.access_token)) {
            // Session has timed out - automatically wipe and stay on login
            await logout();
            return;
          }
          setUser(parsed);
        }
      } catch {
        setUser(null);
      } finally {
        setReady(true);
      }
    }

    restoreUser();
  }, [logout]);

  // Automatic real-time session timeout watcher
  useEffect(() => {
    if (!user?.access_token) return;

    const remainingMs = getTokenRemainingMs(user.access_token);
    if (remainingMs !== null) {
      if (remainingMs <= 0) {
        logout();
        return;
      }
      // Set timer to automatically redirect to login when session expires
      const timer = setTimeout(() => {
        logout();
      }, remainingMs);

      return () => clearTimeout(timer);
    }
  }, [user, logout]);

  async function login(roll_no, password) {
    const data = await loginRequest(roll_no, password);
    const serialized = JSON.stringify(data);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, serialized);
    } catch {}
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, serialized);
      } catch {}
    }
    setUser(data);
  }

  const value = useMemo(
    () => ({
      user,
      ready,
      login,
      logout,
    }),
    [user, ready, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
