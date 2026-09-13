import { Image, Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CabsScreen from '../features/rides/screens/CabsScreen';
import LostFoundScreen from '../features/lost-found/screens/LostFoundScreen';
import TeamFinderScreen from '../features/hackmate/screens/TeamFinderScreen';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

const cabIcon = require('../../assets/icon-cab.png');
const lostFoundIcon = require('../../assets/icon-lostfound.png');
const hackmateIcon = require('../../assets/icon-hackmate.png');

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'web' ? 18 : 12);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 52 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          ...typography.caption,
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Cabs"
        component={CabsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Image
              source={cabIcon}
              style={[styles.tabIcon, { tintColor: color }]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Lost & Found"
        component={LostFoundScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Image
              source={lostFoundIcon}
              style={[styles.tabIcon, { tintColor: color }]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="HackMate"
        component={TeamFinderScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Image
              source={hackmateIcon}
              style={[styles.tabIcon, { tintColor: color }]}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 22,
    height: 22,
  },
});

