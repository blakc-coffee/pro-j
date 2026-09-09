import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';

/**
 * Native vector Light/Dark Contrast Circle Icon (no raster images).
 * Renders the classic system theme toggle symbol: a circle split half-filled and half-outlined.
 */
function DefaultThemeIcon({ size = 20, color }) {
  const half = size / 2;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: half,
        borderWidth: 1.5,
        borderColor: color,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Left half filled */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: half,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export default function ThemeToggle() {
  const { themeMode, colors, toggleTheme } = useTheme();

  return (
    <Pressable
      onPress={toggleTheme}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
        pressed && { opacity: 0.75 },
      ]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Theme switch, current: ${themeMode}`}
    >
      <DefaultThemeIcon size={18} color={colors.foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

