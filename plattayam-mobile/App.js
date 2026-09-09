import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
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

export default function App() {
  useEffect(() => {
    warmUpServer();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <RootNavigator />
          </NavigationContainer>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
