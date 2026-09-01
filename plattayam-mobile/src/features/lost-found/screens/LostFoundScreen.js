import { StyleSheet, View } from 'react-native';

import AppHeader from '../../../components/AppHeader';
import AppShell from '../../../components/AppShell';
import ComingSoon from '../../../components/ComingSoon';
import { colors } from '../../../constants/colors';

export default function LostFoundScreen() {
  return (
    <AppShell>
      <View style={styles.screen}>
        <AppHeader
          title="Lost & Found"
          subtitle="Report or claim lost items on campus"
        />

        <ComingSoon
          title="Lost & Found Hub"
          subtitle="A campus lost-and-found board with item claims and reporting is coming soon."
        />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
