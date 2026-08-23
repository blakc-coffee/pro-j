import { StyleSheet, View } from 'react-native';

import AppHeader from '../components/AppHeader';
import ComingSoon from '../components/ComingSoon';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';

export default function LostFoundScreen() {
  return (
    <View style={styles.screen}>
      <AppHeader
        title="Lost & Found"
        subtitle="Campus lost-and-found is not in v1"
      />
      <View style={styles.body}>
        <ComingSoon
          title="Lost & Found"
          description="This section will help students post and recover lost items. Cab sharing is the v1 flagship feature."
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    padding: spacing.lg,
  },
});
