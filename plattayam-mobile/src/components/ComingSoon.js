import { StyleSheet, Text, View } from 'react-native';

import Card from './Card';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

export default function ComingSoon({ title, subtitle }) {
  return (
    <Card padding="xl" style={styles.card}>
      <Text style={styles.kicker}>Feature In Development</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: spacing.lg,
    alignItems: 'flex-start',
  },
  kicker: {
    ...typography.caption,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.heading,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.mutedForeground,
  },
});
