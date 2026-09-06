import { StyleSheet, Text } from 'react-native';

import { colors } from '../../../constants/colors';

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
 * Status indicators are always plain text without borders, pills, or background containers.
 */
export default function AvailabilityBadge({ status, style, textStyle }) {
  const canonical = normalizeAvailabilityStatus(status);
  const isOpen = canonical === 'open';

  return (
    <Text
      style={[
        styles.text,
        isOpen ? styles.textOpen : styles.textOccupied,
        style,
        textStyle,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${AVAILABILITY_LABELS[canonical]}`}
    >
      {AVAILABILITY_LABELS[canonical]}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
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
