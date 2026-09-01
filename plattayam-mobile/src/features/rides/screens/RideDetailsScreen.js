import { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

import AppHeader from '../../../components/AppHeader';
import AppShell from '../../../components/AppShell';
import Card from '../../../components/Card';
import PrimaryButton from '../../../components/PrimaryButton';
import RequestRow from '../components/RequestRow';
import ScreenState from '../../../components/ScreenState';
import StatusBadge from '../../../components/StatusBadge';
import UserProfileModal from '../components/UserProfileModal';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import { useAuth } from '../../../context/AuthContext';
import {
  cancelRide,
  deleteRideRequest,
  getRide,
  listRideRequests,
  respondToRideRequest,
  sendRideRequest,
} from '../services/rides';
import {
  formatDate,
  formatFullName,
  formatTime,
  getUserRequestForRide,
  isRideCreator,
  requestStatusKey,
  requestStatusLabel,
  rideStatusKey,
} from '../../../utils/format';

export default function RideDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();

  const cabId = route.params?.cabId;

  const [ride, setRide] = useState(null);
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Actions loading state
  const [actionLoading, setActionLoading] = useState(false);

  // Profile modal state
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    if (!cabId) return;

    setLoading(true);
    setError('');

    try {
      const rideData = await getRide(cabId);
      setRide(rideData);

      // If current user is the ride creator, fetch all requests for this ride
      const isCreator = isRideCreator(rideData, user);
      if (isCreator) {
        try {
          const reqsData = await listRideRequests(cabId);
          setRequests(Array.isArray(reqsData) ? reqsData : []);
        } catch {
          // If 403 or error, keep empty
          setRequests([]);
        }
      }
    } catch (err) {
      setError(err.message || 'Could not load ride details.');
    } finally {
      setLoading(false);
    }
  }, [cabId, user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const isCreator = isRideCreator(ride, user);
  const isFull = rideStatusKey(ride) === 'full';

  // Request status for this user if not creator
  const userRequest = getUserRequestForRide(myRequests, cabId) || (ride?.user_request_status ? { status: ride.user_request_status } : null);
  const userStatusKey = userRequest ? requestStatusKey(userRequest.status) : null;
  const hasPendingRequest = userStatusKey === 'pending';
  const hasAcceptedRequest = userStatusKey === 'accepted';

  // Format creator info
  const rawCreatorName = ride?.creator_name || ride?.user_name || ride?.name || 'Campus Rider';
  const creatorName = formatFullName(rawCreatorName) || rawCreatorName;
  const creatorId = ride?.user_id ?? ride?.userId ?? ride?.creator_id;

  async function handleJoinRide() {
    setActionLoading(true);
    try {
      await sendRideRequest(cabId, 1);
      Alert.alert('Request Sent', 'Your request to join this ride has been sent to the host.');
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not send join request.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelMyRequest() {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel your request for this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await deleteRideRequest(cabId);
              loadData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not cancel request.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }

  async function handleCancelRide() {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride? All riders will be notified.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel Ride',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await cancelRide(cabId);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not cancel ride.');
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }

  async function handleRespondRequest(requesterId, action) {
    setActionLoading(true);
    try {
      await respondToRideRequest(cabId, requesterId, action);
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message || `Could not ${action} request.`);
    } finally {
      setActionLoading(false);
    }
  }

  function openProfile(userId) {
    if (userId) {
      setSelectedUserId(userId);
      setProfileModalVisible(true);
    }
  }

  return (
    <AppShell>
      <View style={styles.screen}>
        <AppHeader title="Ride Details" onBack={() => navigation.goBack()} />

        <ScreenState loading={loading} error={error} onRetry={loadData}>
          {ride ? (
            <ScrollView contentContainerStyle={styles.body}>
              {/* Route Card */}
              <Card padding="lg" style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.kicker}>ROUTE</Text>
                  <StatusBadge status={rideStatusKey(ride)} />
                </View>

                <Text style={styles.locationTitle}>{ride.from_loc}</Text>
                <Text style={styles.arrowText}>↓ to</Text>
                <Text style={styles.locationTitle}>{ride.to_loc}</Text>

                <View style={styles.divider} />

                <View style={styles.metaGrid}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Date</Text>
                    <Text style={styles.metaValue}>{formatDate(ride.date)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Time</Text>
                    <Text style={styles.metaValue}>{formatTime(ride.time)}</Text>
                  </View>
                </View>

                <View style={styles.metaGrid}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Available Seats</Text>
                    <Text style={styles.metaValue}>
                      {ride.seats_avbl ?? 0} seats left
                    </Text>
                  </View>
                  {ride.price !== undefined && ride.price !== null ? (
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Cost / Seat</Text>
                      <Text style={styles.metaValue}>₹{ride.price}</Text>
                    </View>
                  ) : null}
                </View>

                {ride.notes ? (
                  <View style={styles.notesSection}>
                    <Text style={styles.metaLabel}>Notes</Text>
                    <Text style={styles.notesText}>{ride.notes}</Text>
                  </View>
                ) : null}
              </Card>

              {/* Host Card */}
              <Card padding="lg" style={styles.card}>
                <Text style={styles.kicker}>POSTED BY</Text>
                <View style={styles.hostRow}>
                  <View style={styles.hostInfo}>
                    <Text style={styles.hostName}>{creatorName}</Text>
                    <Text style={styles.hostMeta}>Ride Host</Text>
                  </View>
                  {creatorId && !isCreator ? (
                    <PrimaryButton
                      label="View Contact"
                      tone="outline"
                      onPress={() => openProfile(creatorId)}
                    />
                  ) : null}
                </View>
              </Card>

              {/* Creator Controls & Requests List */}
              {isCreator ? (
                <View style={styles.creatorSection}>
                  <Card padding="lg" style={styles.card}>
                    <Text style={styles.kicker}>JOIN REQUESTS</Text>
                    {requests.length === 0 ? (
                      <Text style={styles.emptyRequestsText}>
                        No riders have requested to join this ride yet.
                      </Text>
                    ) : (
                      requests.map((req) => {
                        const rId = req.user_id ?? req.id;
                        return (
                          <RequestRow
                            key={req.request_id || req.id || String(rId)}
                            request={req}
                            onPressUser={() => openProfile(rId)}
                            canRespond={true}
                            loadingAction={actionLoading}
                            onAccept={() => handleRespondRequest(rId, 'accept')}
                            onReject={() => handleRespondRequest(rId, 'reject')}
                          />
                        );
                      })
                    )}
                  </Card>

                  <View style={styles.cancelRideWrap}>
                    <PrimaryButton
                      label="Cancel This Ride"
                      tone="destructive"
                      loading={actionLoading}
                      onPress={handleCancelRide}
                    />
                  </View>
                </View>
              ) : (
                /* Rider Action Buttons */
                <View style={styles.riderActions}>
                  {hasAcceptedRequest ? (
                    <Card padding="lg" style={styles.statusCard}>
                      <Text style={styles.acceptedTitle}>You are booked for this ride!</Text>
                      <Text style={styles.acceptedSub}>
                        Coordinate with {creatorName} using the contact info above.
                      </Text>
                      <PrimaryButton
                        label="Cancel My Seat"
                        tone="destructive"
                        loading={actionLoading}
                        onPress={handleCancelMyRequest}
                      />
                    </Card>
                  ) : hasPendingRequest ? (
                    <Card padding="lg" style={styles.statusCard}>
                      <Text style={styles.pendingTitle}>Request Pending</Text>
                      <Text style={styles.pendingSub}>
                        Waiting for {creatorName} to accept your request.
                      </Text>
                      <PrimaryButton
                        label="Withdraw Request"
                        tone="secondary"
                        loading={actionLoading}
                        onPress={handleCancelMyRequest}
                      />
                    </Card>
                  ) : isFull ? (
                    <PrimaryButton
                      label="Ride is Full"
                      tone="secondary"
                      disabled
                    />
                  ) : (
                    <PrimaryButton
                      label="Request to Join Ride"
                      tone="primary"
                      loading={actionLoading}
                      onPress={handleJoinRide}
                    />
                  )}
                </View>
              )}
            </ScrollView>
          ) : null}
        </ScreenState>

        {/* User Profile Modal */}
        <UserProfileModal
          userId={selectedUserId}
          visible={profileModalVisible}
          onClose={() => {
            setProfileModalVisible(false);
            setSelectedUserId(null);
          }}
        />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  kicker: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  locationTitle: {
    ...typography.title,
    color: colors.foreground,
  },
  arrowText: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginVertical: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  metaGrid: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginBottom: 2,
  },
  metaValue: {
    ...typography.subheading,
    color: colors.foreground,
  },
  notesSection: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  notesText: {
    ...typography.body,
    color: colors.foreground,
    marginTop: 2,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    ...typography.subheading,
    color: colors.foreground,
  },
  hostMeta: {
    ...typography.caption,
    color: colors.mutedForeground,
  },
  creatorSection: {
    marginTop: spacing.xs,
  },
  emptyRequestsText: {
    ...typography.body,
    color: colors.mutedForeground,
    marginTop: spacing.sm,
  },
  cancelRideWrap: {
    marginTop: spacing.sm,
  },
  riderActions: {
    marginTop: spacing.sm,
  },
  statusCard: {
    marginBottom: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  acceptedTitle: {
    ...typography.subheading,
    color: colors.success,
    textAlign: 'center',
  },
  acceptedSub: {
    ...typography.caption,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  pendingTitle: {
    ...typography.subheading,
    color: colors.warning,
    textAlign: 'center',
  },
  pendingSub: {
    ...typography.caption,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
});
