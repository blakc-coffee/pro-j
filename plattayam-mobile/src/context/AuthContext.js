import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { setOnUnauthorized } from '../services/api';
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
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch {
        setUser(null);
      } finally {
        setReady(true);
      }
    }

    restoreUser();
  }, []);

  async function login(roll_no, password) {
    const data = await loginRequest(roll_no, password);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
