import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import AppHeader from '../components/AppHeader';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../constants/colors';
import { radius, spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { useAuth } from '../context/AuthContext';
import { listMyRequests, listMyRides } from '../services/rides';
import { requestStatusKey } from '../utils/format';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [posted, setPosted] = useState(0);
  const [joined, setJoined] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [rides, requests] = await Promise.all([
        listMyRides(),
        listMyRequests(),
      ]);
      setPosted(Array.isArray(rides) ? rides.length : 0);
      setJoined(
        (Array.isArray(requests) ? requests : []).filter(
          (item) => requestStatusKey(item.status) === 'accepted'
        ).length
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  return (
    <View style={styles.screen}>
      <AppHeader title="Profile" subtitle="Your campus account" />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.card}>
            <Text style={styles.name}>{user?.email_id?.split('@')[0]}</Text>
            <Text style={styles.email}>{user?.email_id}</Text>
            <Text style={styles.note}>
              The backend has no profile endpoint, so name and batch are not
              loaded from the database.
            </Text>
          </View>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{posted}</Text>
              <Text style={styles.statLabel}>Rides posted</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{joined}</Text>
              <Text style={styles.statLabel}>Rides joined</Text>
            </View>
          </View>

          {error ? (
            <Pressable style={styles.errorCard} onPress={loadStats}>
              <Text style={styles.errorTitle}>Could not refresh ride counts</Text>
              <Text style={styles.errorText}>{error} Tap to retry.</Text>
            </Pressable>
          ) : null}

          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('MyRides')}
          >
            <Text style={styles.rowTitle}>My Rides & Requests</Text>
            <Text style={styles.rowHint}>Posted rides and join requests</Text>
          </Pressable>

          <Pressable
            style={styles.row}
            onPress={() =>
              Alert.alert('Notifications', 'This setting is not in the backend.')
            }
          >
            <Text style={styles.rowTitle}>Notifications</Text>
            <Text style={styles.rowHint}>Placeholder</Text>
          </Pressable>

          <Pressable
            style={styles.row}
            onPress={() =>
              Alert.alert('Privacy & Safety', 'This setting is not in the backend.')
            }
          >
            <Text style={styles.rowTitle}>Privacy & Safety</Text>
            <Text style={styles.rowHint}>Placeholder</Text>
          </Pressable>

          <PrimaryButton label="Logout" tone="destructive" onPress={logout} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  name: {
    ...typography.title,
    fontSize: 24,
    color: colors.foreground,
  },
  email: {
    ...typography.body,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
  },
  note: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginTop: spacing.md,
    lineHeight: 18,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  errorCard: {
    backgroundColor: colors.destructiveSoft,
    borderColor: colors.destructive,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  errorTitle: {
    ...typography.label,
    color: colors.destructive,
  },
  errorText: {
    ...typography.caption,
    color: colors.destructive,
    marginTop: spacing.xs,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  statValue: {
    ...typography.title,
    color: colors.foreground,
  },
  statLabel: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
  },
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  rowTitle: {
    ...typography.heading,
    color: colors.foreground,
  },
  rowHint: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
  },
});
