import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/colors';
import { radius, spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

export default function PrimaryButton({
  label,
  loadingLabel,
  onPress,
  disabled,
  loading,
  tone = 'primary',
  style,
  textStyle,
}) {
  const isOutline = tone === 'outline';

  const backgroundColor = isOutline
    ? colors.card
    : tone === 'accent'
    ? colors.accent
    : tone === 'destructive'
    ? colors.destructive
    : tone === 'secondary'
    ? colors.surfaceAlt
    : colors.primary;

  const textColor = isOutline
    ? colors.primary
    : tone === 'secondary'
    ? colors.foreground
    : colors.primaryForeground;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        isOutline && styles.outlineButton,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading) }}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={textColor}
            style={loadingLabel ? styles.spinner : undefined}
          />
          {loadingLabel ? (
            <Text style={[styles.label, { color: textColor }, textStyle]}>
              {loadingLabel}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text style={[styles.label, { color: textColor }, textStyle]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.sm, // 8px button radius
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.88,
  },
  label: {
    ...typography.body,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginRight: spacing.xs,
  },
});
