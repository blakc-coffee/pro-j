import { useEffect, useMemo } from 'react';
import { Alert, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import { warmUpServer } from './src/services/api';

// Polyfill Alert.alert for React Native Web so button callbacks and confirmations work
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  Alert.alert = function (title, message, buttons) {
    const text = [title, message].filter(Boolean).join('\n');

    if (!buttons || buttons.length === 0) {
      window.alert(text);
      return;
    }

    if (buttons.length === 1) {
      window.alert(text);
      if (typeof buttons[0]?.onPress === 'function') {
        buttons[0].onPress();
      }
      return;
    }

    const cancelButton = buttons.find((b) => b.style === 'cancel');
    const confirmButton =
      buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];

    const confirmed = window.confirm(text);
    if (confirmed) {
      if (typeof confirmButton?.onPress === 'function') {
        confirmButton.onPress();
      }
    } else {
      if (typeof cancelButton?.onPress === 'function') {
        cancelButton.onPress();
      }
    }
  };
}

function AppInner() {
  const { themeMode, isDark, colors: activeColors } = useTheme();

  const navigationTheme = useMemo(() => {
    const baseTheme = isDark ? DarkTheme : DefaultTheme;
    const defaultFonts = {
      regular: {
        fontFamily: 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontWeight: '400',
      },
      medium: {
        fontFamily: 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontWeight: '500',
      },
      bold: {
        fontFamily: 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontWeight: '600',
      },
      heavy: {
        fontFamily: 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontWeight: '700',
      },
    };

    return {
      ...baseTheme,
      dark: isDark,
      colors: {
        ...(baseTheme?.colors || {}),
        primary: activeColors.primary,
        background: activeColors.background,
        card: activeColors.card,
        text: activeColors.foreground,
        border: activeColors.border,
        notification: activeColors.badgeNotification,
      },
      fonts: baseTheme?.fonts || defaultFonts,
    };
  }, [isDark, activeColors]);

  return (
    <AuthProvider>
      <NotificationProvider>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <RootNavigator />
        </NavigationContainer>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default function App() {
  useEffect(() => {
    warmUpServer();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
