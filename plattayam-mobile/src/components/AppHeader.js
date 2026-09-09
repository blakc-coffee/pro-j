import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

export default function AppHeader({
  title,
  subtitle,
  onBack,
  onBackPress,
  actionLabel,
  onAction,
  rightAction,
}) {
  const insets = useSafeAreaInsets();
  const handleBack = onBack || onBackPress;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        {handleBack ? (
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={8}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.sideText}>← Back</Text>
          </Pressable>
        ) : (
          <View style={styles.sidePlaceholder} />
        )}

        <View style={styles.titles}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        {rightAction ? (
          <View style={styles.rightActionWrap}>{rightAction}</View>
        ) : onAction ? (
          <Pressable
            onPress={onAction}
            style={styles.actionButton}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        ) : (
          <View style={styles.sidePlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card, // Clean white header surface #ffffff
    borderBottomWidth: 1,
    borderBottomColor: colors.border, // Hairline border #eee9e2
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backButton: {
    minWidth: 64,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  actionButton: {
    minWidth: 64,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  rightActionWrap: {
    minWidth: 64,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  sidePlaceholder: {
    minWidth: 64,
    minHeight: 44,
  },
  sideText: {
    color: colors.primary,
    ...typography.label,
    fontWeight: '500',
  },
  actionText: {
    color: colors.accent,
    ...typography.label,
    textAlign: 'right',
    fontWeight: '500',
  },
  titles: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.heading,
    color: colors.foreground,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: 2,
  },
});
