import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';

/**
 * Normalizes any status input to canonical 'open' | 'occupied'.
 * Safely defaults to 'open' if missing or undefined.
 */
export function normalizeAvailabilityStatus(status) {
  if (!status) return 'open';
  const s = String(status).trim().toLowerCase();
  if (s === 'occupied' || s === 'team_found') {
    return 'occupied';
  }
  return 'open';
}

/**
 * Canonical display labels
 */
export const AVAILABILITY_LABELS = {
  open: 'Open to Work',
  occupied: 'Occupied',
};

/**
 * AvailabilityBadge component
 * Follows soft semantic styling with zero colored borders.
 */
export default function AvailabilityBadge({ status, style, textStyle }) {
  const canonical = normalizeAvailabilityStatus(status);
  const isOpen = canonical === 'open';

  return (
    <View
      style={[
        styles.badge,
        isOpen ? styles.badgeOpen : styles.badgeOccupied,
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${AVAILABILITY_LABELS[canonical]}`}
    >
      <Text
        style={[
          styles.text,
          isOpen ? styles.textOpen : styles.textOccupied,
          textStyle,
        ]}
      >
        {AVAILABILITY_LABELS[canonical]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOpen: {
    backgroundColor: colors.successSoft,
  },
  badgeOccupied: {
    backgroundColor: colors.warningSoft,
  },
  text: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  textOpen: {
    color: colors.success,
  },
  textOccupied: {
    color: colors.warning,
  },
});
