import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/colors';
import { radius, spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

const VARIANTS = {
  open: {
    backgroundColor: colors.successSoft,
    color: colors.success,
    label: 'Open',
  },
  full: {
    backgroundColor: colors.secondary,
    color: colors.mutedForeground,
    label: 'Full',
  },
  pending: {
    backgroundColor: colors.warningSoft,
    color: colors.warning,
    label: 'Pending',
  },
  accepted: {
    backgroundColor: colors.successSoft,
    color: colors.success,
    label: 'Accepted',
  },
  rejected: {
    backgroundColor: colors.destructiveSoft,
    color: colors.destructive,
    label: 'Rejected',
  },
  neutral: {
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    label: 'Neutral',
  },
};

export default function StatusBadge({ status, label }) {
  const key = String(status || 'neutral').toLowerCase();
  const variant = VARIANTS[key] || VARIANTS.neutral;

  return (
    <View style={[styles.badge, { backgroundColor: variant.backgroundColor }]}>
      <Text style={[styles.text, { color: variant.color }]}>
        {label || variant.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
