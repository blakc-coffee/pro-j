import { StyleSheet, View } from 'react-native';

import AppHeader from '../components/AppHeader';
import ComingSoon from '../components/ComingSoon';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';

export default function TeamFinderScreen() {
  return (
    <View style={styles.screen}>
      <AppHeader
        title="Team Finder"
        subtitle="Hackathon teams are not in v1"
      />
      <View style={styles.body}>
        <ComingSoon
          title="Team Finder"
          description="This section will help students find hackathon teammates. It is a planned future module."
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
