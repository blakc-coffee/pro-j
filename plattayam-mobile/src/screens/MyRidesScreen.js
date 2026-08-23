import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import AppHeader from '../components/AppHeader';
import RequestRow from '../components/RequestRow';
import RideCard from '../components/RideCard';
import ScreenState from '../components/ScreenState';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { listMyRequests, listMyRides, listRides } from '../services/rides';
import { requestStatusKey } from '../utils/format';

export default function MyRidesScreen() {
  const navigation = useNavigation();
  const [posted, setPosted] = useState([]);
  const [joined, setJoined] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRides = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [myRides, myRequests, allRides] = await Promise.all([listMyRides(), listMyRequests(), listRides()]);
      const acceptedCabIds = new Set((myRequests || []).filter((item) => requestStatusKey(item.status) === 'accepted').map((item) => Number(item.cab_id)));
      setPosted(Array.isArray(myRides) ? myRides : []);
      setRequests(Array.isArray(myRequests) ? myRequests : []);
      setJoined((allRides || []).filter((ride) => acceptedCabIds.has(Number(ride.cab_id))));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadRides(); }, [loadRides]));

  const sections = useMemo(() => [
    { key: 'posted', title: `Posted rides (${posted.length})`, rows: posted, type: 'ride' },
    { key: 'joined', title: `Joined rides (${joined.length})`, rows: joined, type: 'ride' },
    { key: 'requests', title: `Requests (${requests.length})`, rows: requests, type: 'request' },
  ], [posted, joined, requests]);

  return (
    <View style={styles.screen}>
      <AppHeader title="My Rides" subtitle="Your posts, joins, and requests" onBack={() => navigation.goBack()} />
      <ScreenState loading={loading} error={error}>
        <FlatList
          data={sections}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.section}>
              <Text style={styles.title}>{item.title}</Text>
              {item.rows.length ? item.rows.map((row) => item.type === 'ride' ? <RideCard key={row.cab_id} ride={row} /> : <RequestRow key={row.req_id} request={row} />) : <Text style={styles.empty}>Nothing here yet.</Text>}
            </View>
          )}
        />
      </ScreenState>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  section: { marginBottom: spacing.xl },
  title: { ...typography.heading, color: colors.foreground, marginBottom: spacing.md },
  empty: { ...typography.body, color: colors.mutedForeground },
});
