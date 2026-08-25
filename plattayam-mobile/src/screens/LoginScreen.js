import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppHeader from '../components/AppHeader';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../constants/colors';
import { radius, spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../constants/config';

export default function LoginScreen() {
  const { login } = useAuth();
  const apiBaseUrl = getApiBaseUrl();
  const [rollNo, setRollNo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit() {
    if (!rollNo.trim() || !password) {
      setError('Roll number and password are required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(rollNo.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader title="Plattayam" subtitle="IIIT Kottayam campus queries" />

      <View style={styles.body}>
        <Text style={styles.heading}>Sign in</Text>
        <Text style={styles.copy}>
          Use your Moodle credentials to log in.
        </Text>

        <Text style={styles.label}>Roll Number / Username</Text>
        <TextInput
          value={rollNo}
          onChangeText={setRollNo}
          autoCapitalize="none"
          placeholder="2023..."
          placeholderTextColor={colors.mutedForeground}
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
          placeholderTextColor={colors.mutedForeground}
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton label="Login" loading={loading} onPress={onSubmit} />

        <Text style={styles.hint}>
          API: {apiBaseUrl || 'Set EXPO_PUBLIC_API_URL for this device'}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heading: {
    ...typography.title,
    fontSize: 24,
    color: colors.foreground,
  },
  copy: {
    ...typography.body,
    color: colors.mutedForeground,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  label: {
    ...typography.label,
    color: colors.foreground,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.foreground,
  },
  error: {
    color: colors.destructive,
    marginVertical: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginTop: spacing.lg,
  }
});
