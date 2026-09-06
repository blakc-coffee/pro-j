import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import { formatDate, formatCompactName, formatTime, isFullRide } from '../../../utils/format';

export default function RideCard({ ride, footer }) {
  const navigation = useNavigation();

  if (!ride) {
    return null;
  }

  const isFull = isFullRide(ride);
  const travelDate = ride.travel_date || ride.date;
  const depTime = ride.dep_time || ride.time;
  const seats = Number(ride.seats_avbl ?? 0);
  const rawCreatorName = ride.creator_name || ride.user_name || ride.name;
  const creatorName = formatCompactName(rawCreatorName) || rawCreatorName;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => navigation.navigate('RideDetails', { cabId: ride.cab_id })}
      accessibilityRole="button"
      accessibilityLabel={`Ride from ${ride.from_loc} to ${ride.to_loc}`}
    >
      <View style={styles.topRow}>
        <View style={styles.routeContainer}>
          <View style={styles.bulletColumn}>
            <View style={styles.greenBullet} />
            <View style={styles.bulletLine} />
            <View style={styles.redBullet} />
          </View>
          <View style={styles.locationsColumn}>
            <Text style={styles.locationText} numberOfLines={1}>
              {ride.from_loc}
            </Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {ride.to_loc}
            </Text>
          </View>
        </View>

        <Text style={[styles.statusText, isFull && styles.statusTextFull]}>
          {isFull ? 'FULL' : 'OPEN'}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>{formatDate(travelDate)}</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.meta}>{formatTime(depTime)}</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.meta}>
          {seats} {seats === 1 ? 'seat' : 'seats'} left
        </Text>
      </View>

      {creatorName ? (
        <View style={styles.creatorRow}>
          <Text style={styles.creatorText} numberOfLines={1}>
            Posted by {creatorName}
          </Text>
        </View>
      ) : null}

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
  routeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  bulletColumn: {
    width: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    marginRight: spacing.sm,
  },
  greenBullet: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#16a34a',
  },
  bulletLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  redBullet: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#dc2626',
  },
  locationsColumn: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 6,
  },
  locationText: {
    ...typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    lineHeight: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
    letterSpacing: 0.5,
  },
  statusTextFull: {
    color: colors.mutedForeground,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  meta: {
    ...typography.body,
    fontSize: 13,
    color: colors.mutedForeground,
  },
  dot: {
    marginHorizontal: spacing.sm,
    color: colors.mutedForeground,
  },
  footer: {
    marginTop: spacing.md,
  },
  creatorRow: {
    marginTop: spacing.sm,
    paddingTop: 2,
  },
  creatorText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
});
