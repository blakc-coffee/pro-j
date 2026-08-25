import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

import AppHeader from '../components/AppHeader';
import PrimaryButton from '../components/PrimaryButton';
import RequestRow from '../components/RequestRow';
import ScreenState from '../components/ScreenState';
import StatusBadge from '../components/StatusBadge';
import UserProfileModal from '../components/UserProfileModal';
import { colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { radius, spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import {
  createJoinRequest,
  getRide,
  listMyRequests,
  listRideRequests,
  updateRequestStatus,
  getUserProfile,
} from '../services/rides';
import { formatDate, formatTime, formatFullName, getFirstName, requestStatusKey, requestStatusLabel, rideStatusKey } from '../utils/format';

export default function RideDetailsScreen() {
  const { user } = useAuth();
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
  const [profileRequest, setProfileRequest] = useState(null);
  const [profiles, setProfiles] = useState({});
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [creatorProfileLoading, setCreatorProfileLoading] = useState(false);
  const [creatorModalVisible, setCreatorModalVisible] = useState(false);

  async function openProfile(request) {
    setProfileRequest(request);

    // Check if we already fetched this profile
    const cachedProfile = profiles[request.req_user_id];
    if (cachedProfile) {
      setProfileData(cachedProfile);
      setProfileLoading(false);
      return;
    }

    setProfileData(null);
    setProfileLoading(true);
    try {
      const data = await getUserProfile(request.req_user_id);
      setProfileData(data);
    } catch (err) {
      console.log('Failed to fetch profile', err);
    } finally {
      setProfileLoading(false);
    }
  }

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

      setCreatorProfileLoading(true);
      try {
        const cProfile = await getUserProfile(nextRide.user_id);
        setCreatorProfile(cProfile);
      } catch (err) {
        console.log('Failed to fetch creator profile', err);
        setCreatorProfile(null);
      } finally {
        setCreatorProfileLoading(false);
      }

      const isOwner = user && nextRide && Number(nextRide.user_id) === Number(user.user_id);
      if (isOwner) {
        const reqs = await listRideRequests(cabId);
        setRequests(reqs);
        setMyRequest(null);

        // Fetch profiles
        const newProfiles = { ...profiles };
        const missingUserIds = [...new Set(reqs.map(r => r.req_user_id))].filter(id => !newProfiles[id]);

        if (missingUserIds.length > 0) {
          await Promise.all(
            missingUserIds.map(async (id) => {
              try {
                newProfiles[id] = await getUserProfile(id);
              } catch (err) {
                console.log('Failed to fetch profile for', id, err);
              }
            })
          );
          setProfiles(newProfiles);
        }
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
  }, [cabId, profiles]);

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

  const owner = ride && user && Number(ride.user_id) === Number(user.user_id);
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
                <Text style={styles.owner}>
                  Posted by{' '}
                  {creatorProfileLoading ? (
                    <Text>Loading...</Text>
                  ) : (
                    <Text onPress={() => setCreatorModalVisible(true)}>
                      {creatorProfile?.name
                        ? getFirstName(formatFullName(creatorProfile.name))
                        : `User #${ride.user_id}`}
                    </Text>
                  )}
                </Text>
              </View>

              {owner ? (
                <View>
                  <Text style={styles.sectionTitle}>Join requests</Text>
                  {requests.length ? requests.map((request) => (
                    <RequestRow
                      key={request.req_id}
                      request={request}
                      profile={profiles[request.req_user_id]}
                      showActions={requestStatusKey(request.status) === 'pending'}
                      busy={updatingId === request.req_id}
                      onAccept={() => updateRequest(request.req_id, 'Accepted')}
                      onReject={() => updateRequest(request.req_id, 'Rejected')}
                      onPressUser={() => openProfile(request)}
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

      <UserProfileModal
        visible={!!profileRequest || creatorModalVisible}
        userId={profileRequest ? profileRequest.req_user_id : ride?.user_id}
        request={profileRequest}
        profile={profileRequest ? profileData : creatorProfile}
        loading={profileRequest ? profileLoading : creatorProfileLoading}
        onClose={() => {
          setProfileRequest(null);
          setCreatorModalVisible(false);
        }}
        busy={profileRequest && updatingId === profileRequest.req_id}
        onAccept={() => {
          if (profileRequest) updateRequest(profileRequest.req_id, 'Accepted');
          setProfileRequest(null);
        }}
        onReject={() => {
          if (profileRequest) updateRequest(profileRequest.req_id, 'Rejected');
          setProfileRequest(null);
        }}
      />
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
