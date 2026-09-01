import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import MyRidesScreen from '../features/rides/screens/MyRidesScreen';
import PostRideScreen from '../features/rides/screens/PostRideScreen';
import RideDetailsScreen from '../features/rides/screens/RideDetailsScreen';
import CandidateProfileScreen from '../features/hackmate/screens/CandidateProfileScreen';
import CreateProfileCardScreen from '../features/hackmate/screens/CreateProfileCardScreen';
import CreateTeamScreen from '../features/hackmate/screens/CreateTeamScreen';
import HackFindHubScreen from '../features/hackmate/screens/HackFindHubScreen';
import MyTeamsScreen from '../features/hackmate/screens/MyTeamsScreen';
import TeamDetailsScreen from '../features/hackmate/screens/TeamDetailsScreen';
import TeamRequestsScreen from '../features/hackmate/screens/TeamRequestsScreen';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export default function RootNavigator() {
  const { ready, user } = useAuth();

  if (!ready) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="PostRide" component={PostRideScreen} />
          <Stack.Screen name="RideDetails" component={RideDetailsScreen} />
          <Stack.Screen name="MyRides" component={MyRidesScreen} />
          {/* Hack Find Stack Routes */}
          <Stack.Screen name="HackFindHub" component={HackFindHubScreen} />
          <Stack.Screen name="TeamDetails" component={TeamDetailsScreen} />
          <Stack.Screen name="CreateTeam" component={CreateTeamScreen} />
          <Stack.Screen name="MyTeams" component={MyTeamsScreen} />
          <Stack.Screen name="CandidateProfile" component={CandidateProfileScreen} />
          <Stack.Screen name="CreateProfileCard" component={CreateProfileCardScreen} />
          <Stack.Screen name="TeamRequests" component={TeamRequestsScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
});
