import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';

import AppHeader from '../components/AppHeader';
import AppShell from '../components/AppShell';
import Card from '../components/Card';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
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
    <AppShell>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <AppHeader title="Plattayam" subtitle="IIIT Kottayam campus queries" />

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Card padding="xl" style={styles.card}>
            <Text style={styles.heading}>IIITK Authentication</Text>
            <Text style={styles.subtext}>Use your LMS credentials</Text>

            <FormInput
              label="Roll Number / Username"
              value={rollNo}
              onChangeText={setRollNo}
              autoCapitalize="none"
              placeholder="e.g. 2023110001"
            />

            <FormInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Enter your password"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PrimaryButton label="Sign In" loading={loading} onPress={onSubmit} />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    padding: spacing.lg,
  },
  card: {
    marginTop: spacing.md,
  },
  heading: {
    ...typography.title,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: colors.accent,
  },
  subtext: {
    ...typography.caption,
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedForeground,
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  error: {
    color: colors.destructive,
    marginBottom: spacing.md,
    ...typography.caption,
  },
});
