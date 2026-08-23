import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

export default function AppHeader({
  title,
  subtitle,
  onBack,
  actionLabel,
  onAction,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.sideButton} hitSlop={8}>
            <Text style={styles.sideText}>Back</Text>
          </Pressable>
        ) : (
          <View style={styles.sideButton} />
        )}

        <View style={styles.titles}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        {onAction ? (
          <Pressable onPress={onAction} style={styles.sideButton} hitSlop={8}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        ) : (
          <View style={styles.sideButton} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sideButton: {
    minWidth: 56,
  },
  sideText: {
    color: colors.primary,
    fontWeight: '600',
  },
  actionText: {
    color: colors.accent,
    fontWeight: '700',
    textAlign: 'right',
  },
  titles: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...typography.title,
    color: colors.foreground,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
