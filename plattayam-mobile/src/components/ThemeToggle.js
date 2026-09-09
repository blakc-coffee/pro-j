import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';

/**
 * Native vector Light/Dark Contrast Circle Icon (no raster images).
 * Renders the classic system theme toggle symbol: a circle split half-filled and half-outlined.
 */
function DefaultThemeIcon({ size = 20, color, isDark }) {
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
  const { themeMode, isDark, colors, setThemeMode } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  function selectTheme(mode) {
    setThemeMode(mode);
    setModalVisible(false);
  }

  return (
    <>
      {/* Top-right Icon Button */}
      <Pressable
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [
          styles.iconButton,
          { backgroundColor: isDark ? '#11151a' : colors.surfaceAlt, borderColor: colors.border },
          pressed && { opacity: 0.75 },
        ]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Theme switch, current: ${themeMode}`}
      >
        <DefaultThemeIcon size={18} color={colors.foreground} isDark={isDark} />
      </Pressable>

      {/* 2-Options Modal: Light & Dark */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable
            style={[
              styles.dialogCard,
              {
                backgroundColor: isDark ? '#000000' : colors.card,
                borderColor: isDark ? '#292d30' : colors.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.dialogHeader}>
              <DefaultThemeIcon size={22} color={colors.foreground} isDark={isDark} />
              <Text style={[styles.dialogTitle, { color: colors.foreground }]}>Appearance</Text>
            </View>
            <Text style={[styles.dialogSubtitle, { color: colors.mutedForeground }]}>
              Select your preferred app theme
            </Text>

            {/* Option 1: Light */}
            <Pressable
              onPress={() => selectTheme('light')}
              style={({ pressed }) => [
                styles.optionRow,
                {
                  backgroundColor: themeMode === 'light' ? (isDark ? '#11151a' : colors.surfaceAlt) : 'transparent',
                  borderColor: themeMode === 'light' ? colors.primary : (isDark ? '#292d30' : colors.border),
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={styles.optionLeft}>
                <View
                  style={[
                    styles.radioCircle,
                    { borderColor: themeMode === 'light' ? colors.primary : colors.mutedForeground },
                  ]}
                >
                  {themeMode === 'light' ? (
                    <View style={[styles.radioFill, { backgroundColor: colors.primary }]} />
                  ) : null}
                </View>
                <View style={styles.optionTextWrap}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>Light</Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                    Warm Cream Editorial Workspace
                  </Text>
                </View>
              </View>
              <Text style={[styles.symbolText, { color: colors.primary }]}>☀️</Text>
            </Pressable>

            {/* Option 2: Dark */}
            <Pressable
              onPress={() => selectTheme('dark')}
              style={({ pressed }) => [
                styles.optionRow,
                {
                  backgroundColor: themeMode === 'dark' ? (isDark ? '#0b0e14' : colors.surfaceAlt) : 'transparent',
                  borderColor: themeMode === 'dark' ? colors.primary : (isDark ? '#292d30' : colors.border),
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={styles.optionLeft}>
                <View
                  style={[
                    styles.radioCircle,
                    { borderColor: themeMode === 'dark' ? colors.primary : colors.mutedForeground },
                  ]}
                >
                  {themeMode === 'dark' ? (
                    <View style={[styles.radioFill, { backgroundColor: colors.primary }]} />
                  ) : null}
                </View>
                <View style={styles.optionTextWrap}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>Dark</Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                    Resend Black Velvet with Violet Neon
                  </Text>
                </View>
              </View>
              <Text style={[styles.symbolText, { color: colors.accent }]}>🌙</Text>
            </Pressable>

            {/* Done button */}
            <Pressable
              onPress={() => setModalVisible(false)}
              style={[styles.doneButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.doneButtonText, { color: colors.primaryForeground }]}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.xl || 16,
    borderWidth: 1,
    padding: spacing.lg,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  dialogTitle: {
    ...typography.subheading,
    fontWeight: '700',
  },
  dialogSubtitle: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionLabel: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 15,
  },
  optionDesc: {
    ...typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  symbolText: {
    fontSize: 18,
    marginLeft: spacing.sm,
  },
  doneButton: {
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  doneButtonText: {
    ...typography.label,
    fontWeight: '600',
  },
});
