import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { colors } from '../constants/colors';
import { radius, spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { formatDate, formatTime, rideStatusKey } from '../utils/format';
import StatusBadge from './StatusBadge';

export default function RideCard({ ride, footer }) {
  const navigation = useNavigation();

  if (!ride) {
    return null;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => navigation.navigate('RideDetails', { cabId: ride.cab_id })}
    >
      <View style={styles.topRow}>
        <View style={styles.route}>
          <Text style={styles.from}>{ride.from_loc}</Text>
          <Text style={styles.arrow}>→</Text>
          <Text style={styles.to}>{ride.to_loc}</Text>
        </View>
        <StatusBadge status={rideStatusKey(ride)} />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>{formatDate(ride.travel_date)}</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.meta}>{formatTime(ride.dep_time)}</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.meta}>
          {ride.seats_avbl} {ride.seats_avbl === 1 ? 'seat' : 'seats'} left
        </Text>
      </View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  route: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  from: {
    ...typography.heading,
    color: colors.foreground,
  },
  to: {
    ...typography.heading,
    color: colors.foreground,
  },
  arrow: {
    color: colors.mutedForeground,
    fontSize: 16,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  meta: {
    ...typography.body,
    color: colors.mutedForeground,
  },
  dot: {
    marginHorizontal: spacing.sm,
    color: colors.mutedForeground,
  },
  footer: {
    marginTop: spacing.md,
  },
});
