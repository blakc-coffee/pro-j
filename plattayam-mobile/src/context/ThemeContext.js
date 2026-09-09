import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getActiveTheme, setActiveTheme, themes } from '../constants/theme';

const STORAGE_KEY = 'plattayam.theme';
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function restoreTheme() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') {
          setThemeModeState(saved);
          setActiveTheme(saved);
        }
      } catch {
        // Fallback to default light
      } finally {
        setReady(true);
      }
    }
    restoreTheme();
  }, []);

  const setThemeMode = useCallback(async (mode) => {
    if (mode !== 'light' && mode !== 'dark') return;
    setThemeModeState(mode);
    setActiveTheme(mode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    const nextMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextMode);
  }, [themeMode, setThemeMode]);

  const activeTheme = useMemo(() => {
    return themes[themeMode] || themes.light;
  }, [themeMode]);

  const value = useMemo(() => ({
    themeMode,
    isDark: themeMode === 'dark',
    colors: activeTheme,
    setThemeMode,
    toggleTheme,
    ready,
  }), [themeMode, activeTheme, setThemeMode, toggleTheme, ready]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
