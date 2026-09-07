import { Image, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

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
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
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

