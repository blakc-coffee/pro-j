import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import CabsScreen from '../features/rides/screens/CabsScreen';
import LostFoundScreen from '../features/lost-found/screens/LostFoundScreen';
import TeamFinderScreen from '../features/hackmate/screens/TeamFinderScreen';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: typography.caption,
      }}
    >
      <Tab.Screen name="Cabs" component={CabsScreen} />
      <Tab.Screen name="Lost & Found" component={LostFoundScreen} />
      <Tab.Screen name="HackMate" component={TeamFinderScreen} />
    </Tab.Navigator>
  );
}
