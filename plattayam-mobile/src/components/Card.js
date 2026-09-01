import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../constants/colors';
import { radius, spacing } from '../constants/spacing';

const PADDING_MAP = {
  none: 0,
  sm: spacing.sm, // 12
  md: spacing.md, // 18
  lg: spacing.lg, // 24
  xl: spacing.xl, // 36
};

export default function Card({
  children,
  onPress,
  style,
  padding = 'lg',
  elevated = false,
}) {
  const paddingValue = PADDING_MAP[padding] ?? PADDING_MAP.lg;

  const cardStyle = [
    styles.card,
    { padding: paddingValue },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
        accessible
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg, // 8px card radius
    borderWidth: 1,
    borderColor: colors.border, // 1px hairline border #eee9e2
  },
  pressed: {
    opacity: 0.9,
    backgroundColor: colors.surfaceAlt,
  },
});
