import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import CabsScreen from '../screens/CabsScreen';
import LostFoundScreen from '../screens/LostFoundScreen';
import TeamFinderScreen from '../screens/TeamFinderScreen';
import ProfileScreen from '../screens/ProfileScreen';
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
      <Tab.Screen name="Team Finder" component={TeamFinderScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
