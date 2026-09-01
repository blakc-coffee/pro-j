import { StyleSheet, Text } from 'react-native';

import { colors } from '../constants/colors';

const VARIANTS = {
  open: {
    color: colors.success,
    label: 'Open',
  },
  full: {
    color: colors.mutedForeground,
    label: 'Full',
  },
  pending: {
    color: colors.warning,
    label: 'Pending',
  },
  requested: {
    color: colors.warning,
    label: 'Requested',
  },
  accepted: {
    color: colors.success,
    label: 'Accepted',
  },
  rejected: {
    color: colors.destructive,
    label: 'Rejected',
  },
  neutral: {
    color: colors.mutedForeground,
    label: 'Neutral',
  },
};

export default function StatusBadge({ status, label, style }) {
  const key = String(status || 'neutral').toLowerCase();
  const variant = VARIANTS[key] || VARIANTS.neutral;

  return (
    <Text
      style={[styles.text, { color: variant.color }, style]}
      accessibilityRole="text"
    >
      {label || variant.label}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
