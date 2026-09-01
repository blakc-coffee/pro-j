import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import Card from '../../../components/Card';
import StatusBadge from '../../../components/StatusBadge';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import {
  formatDate,
  formatFullName,
  formatTime,
  isFullRide,
} from '../../../utils/format';

export default function RideCard({ ride }) {
  const navigation = useNavigation();

  const isFull = isFullRide(ride);
  const seats = Number(ride.seats_avbl ?? 0);
  const rawCreatorName = ride.creator_name || ride.user_name || ride.name;
  const creatorName = formatFullName(rawCreatorName) || rawCreatorName;

  return (
    <Card padding="none" style={styles.card}>
      <Pressable
        onPress={() => navigation.navigate('RideDetails', { cabId: ride.cab_id })}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Ride from ${ride.from_loc} to ${ride.to_loc}`}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.kicker}>RIDE SHARE</Text>
          <StatusBadge status={isFull ? 'full' : 'open'} />
        </View>

        <Text style={styles.routeText} numberOfLines={1}>
          {ride.from_loc} → {ride.to_loc}
        </Text>

        <Text style={styles.metaText}>
          {formatDate(ride.date)} at {formatTime(ride.time)}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.seatsText}>
            {isFull ? '0 seats available' : `${seats} seat${seats === 1 ? '' : 's'} available`}
          </Text>
          {creatorName ? (
            <Text style={styles.creatorText} numberOfLines={1}>
              Posted by {creatorName}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  pressable: {
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.88,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  kicker: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  routeText: {
    ...typography.heading,
    color: colors.foreground,
    marginBottom: 4,
  },
  metaText: {
    ...typography.body,
    color: colors.mutedForeground,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  seatsText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
  creatorText: {
    ...typography.caption,
    color: colors.mutedForeground,
    maxWidth: '50%',
  },
});
