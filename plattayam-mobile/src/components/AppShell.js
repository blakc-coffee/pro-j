import { Platform, StyleSheet, View } from 'react-native';
import { colors } from '../constants/colors';

export default function AppShell({ children, style }) {
  return (
    <View style={styles.outer}>
      <View style={[styles.inner, style]}>
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
