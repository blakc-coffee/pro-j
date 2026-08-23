import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/colors';
import { radius, spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

export default function ComingSoon({ title, description }) {
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>Coming soon</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  kicker: {
    ...typography.caption,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.heading,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.mutedForeground,
    lineHeight: 22,
  },
});
