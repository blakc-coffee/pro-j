import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

import AppHeader from '../../../components/AppHeader';
import AppShell from '../../../components/AppShell';
import ScreenState from '../../../components/ScreenState';
import TeamRequestCard from '../components/TeamRequestCard';
import { spacing } from '../../../constants/spacing';
import { listTeamRequests, respondToTeamRequest } from '../services/hackfind';

export default function TeamRequestsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const teamId = route.params?.teamId;
  const teamName = route.params?.teamName || 'Team';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadRequests = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError('');
    try {
      const data = await listTeamRequests(teamId);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load team join requests.');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  const handleRespond = async (reqId, status) => {
    setBusyId(reqId);
    try {
      await respondToTeamRequest(teamId, reqId, status);
      Alert.alert(
        status === 'accepted' ? 'Request Accepted' : 'Request Rejected',
        `The application has been ${status}.`
      );
      loadRequests();
    } catch (err) {
      Alert.alert('Error', err.message || `Failed to ${status} request.`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell>
      <View style={styles.screen}>
        <AppHeader
          title="Join Requests"
          subtitle={teamName}
          onBack={() => navigation.goBack()}
        />

        <ScreenState
          loading={loading}
          error={error}
          onRetry={loadRequests}
          empty={!loading && !error && requests.length === 0}
          emptyMessage="No join requests received yet."
        >
          <FlatList
            data={requests}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TeamRequestCard
                request={item}
                busy={busyId === item.id}
                onAccept={() => handleRespond(item.id, 'accepted')}
                onReject={() => handleRespond(item.id, 'rejected')}
              />
            )}
            contentContainerStyle={styles.list}
          />
        </ScreenState>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    padding: spacing.lg,
  },
});
