import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

import AppHeader from '../components/AppHeader';
import PrimaryButton from '../components/PrimaryButton';
import RequestRow from '../components/RequestRow';
import ScreenState from '../components/ScreenState';
import StatusBadge from '../components/StatusBadge';
import { colors } from '../constants/colors';
import { CURRENT_USER_ID } from '../constants/config';
import { radius, spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import {
  createJoinRequest,
  getRide,
  listMyRequests,
  listRideRequests,
  updateRequestStatus,
} from '../services/rides';
import { formatDate, formatTime, requestStatusKey, requestStatusLabel, rideStatusKey } from '../utils/format';

export default function RideDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const cabId = route.params?.cabId;
  const [ride, setRide] = useState(null);
  const [requests, setRequests] = useState([]);
  const [myRequest, setMyRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const loadDetails = useCallback(async () => {
    if (!cabId) {
      setError('Ride ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const nextRide = await getRide(cabId);
      setRide(nextRide);
      const owner = Number(nextRide.user_id) === CURRENT_USER_ID;
      if (owner) {
        setRequests(await listRideRequests(cabId));
        setMyRequest(null);
      } else {
        const allRequests = await listMyRequests();
        setMyRequest((allRequests || []).find((item) => Number(item.cab_id) === Number(cabId)) || null);
        setRequests([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [cabId]);

  useFocusEffect(useCallback(() => { loadDetails(); }, [loadDetails]));

  async function requestToJoin() {
    setSubmitting(true);
    try {
      const request = await createJoinRequest(cabId);
      setMyRequest(request);
    } catch (err) {
      Alert.alert('Could not request to join', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function updateRequest(requestId, status) {
    setUpdatingId(requestId);
    try {
      await updateRequestStatus(requestId, status);
      await loadDetails();
    } catch (err) {
      Alert.alert('Could not update request', err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  const owner = ride && Number(ride.user_id) === CURRENT_USER_ID;
  const full = ride && rideStatusKey(ride) === 'full';

  return (
    <View style={styles.screen}>
      <AppHeader title="Ride details" onBack={() => navigation.goBack()} />
      <ScreenState loading={loading} error={error}>
        <ScrollView contentContainerStyle={styles.body}>
          {ride ? (
            <>
              <View style={styles.card}>
                <View style={styles.titleRow}>
                  <Text style={styles.route}>{ride.from_loc} → {ride.to_loc}</Text>
                  <StatusBadge status={rideStatusKey(ride)} />
                </View>
                <Text style={styles.meta}>{formatDate(ride.travel_date)} · {formatTime(ride.dep_time)}</Text>
                <Text style={styles.seats}>{ride.seats_avbl} seats remaining</Text>
                <Text style={styles.owner}>Posted by user #{ride.user_id}</Text>
              </View>

              {owner ? (
                <View>
                  <Text style={styles.sectionTitle}>Join requests</Text>
                  {requests.length ? requests.map((request) => (
                    <RequestRow
                      key={request.req_id}
                      request={request}
                      showActions={requestStatusKey(request.status) === 'pending'}
                      busy={updatingId === request.req_id}
                      onAccept={() => updateRequest(request.req_id, 'Accepted')}
                      onReject={() => updateRequest(request.req_id, 'Rejected')}
                    />
                  )) : <Text style={styles.empty}>No one has requested to join yet.</Text>}
                </View>
              ) : myRequest ? (
                <View style={styles.requestState}>
                  <Text style={styles.sectionTitle}>Your request</Text>
                  <StatusBadge status={requestStatusKey(myRequest.status)} label={requestStatusLabel(myRequest.status)} />
                </View>
              ) : (
                <PrimaryButton label={full ? 'Ride is full' : 'Request to Join'} loading={submitting} disabled={full} onPress={requestToJoin} />
              )}
            </>
          ) : null}
        </ScrollView>
      </ScreenState>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.xl },
  titleRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  route: { ...typography.title, color: colors.foreground, flex: 1, fontSize: 22 },
  meta: { ...typography.body, color: colors.mutedForeground, marginTop: spacing.lg },
  seats: { ...typography.heading, color: colors.foreground, marginTop: spacing.sm },
  owner: { ...typography.caption, color: colors.mutedForeground, marginTop: spacing.lg },
  sectionTitle: { ...typography.heading, color: colors.foreground, marginBottom: spacing.md },
  empty: { ...typography.body, color: colors.mutedForeground },
  requestState: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, padding: spacing.lg },
});
