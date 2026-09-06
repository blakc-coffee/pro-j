import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';

export default function AppShell({ children, style, safeTop = false }) {
  const insets = useSafeAreaInsets();
  const topPadding = safeTop
    ? Math.max(insets.top, 0) + (Platform.OS === 'web' ? spacing.md : spacing.sm)
    : 0;

  return (
    <View style={styles.outer}>
      <View style={[styles.inner, topPadding > 0 && { paddingTop: topPadding }, style]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    width: '100%',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 600 : '100%',
    backgroundColor: colors.background,
  },
});
