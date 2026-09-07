import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

import AppHeader from '../../../components/AppHeader';
import AppShell from '../../../components/AppShell';
import Avatar from '../../../components/Avatar';
import Card from '../../../components/Card';
import PrimaryButton from '../../../components/PrimaryButton';
import ScreenState from '../../../components/ScreenState';
import StatusBadge from '../../../components/StatusBadge';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import { useAuth } from '../../../context/AuthContext';
import {
  applyToTeam,
  deleteTeam,
  getTeam,
  leaveTeam,
  listTeamRequests,
  removeTeamMember,
  respondToTeamRequest,
} from '../services/hackfind';
import TeamRequestCard from '../components/TeamRequestCard';
import { formatFullName } from '../../../utils/format';

export default function TeamDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const currentUserId = String(user?.user_id ?? user?.id ?? '');

  const teamId = route.params?.teamId;

  const [team, setTeam] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const loadData = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError('');
    try {
      // 1. Fetch team first
      const teamRes = await getTeam(teamId);
      setTeam(teamRes);

      // 2. Fetch requests ONLY if authenticated user is the team leader
      const leaderId = String(teamRes?.leaderId || teamRes?.leader_id || '');
      if (currentUserId && leaderId && currentUserId === leaderId) {
        try {
          const reqsRes = await listTeamRequests(teamId);
          setRequests(Array.isArray(reqsRes) ? reqsRes : []);
        } catch {
          setRequests([]);
        }
      } else {
        setRequests([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load team details.');
    } finally {
      setLoading(false);
    }
  }, [teamId, currentUserId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const isLeader = team && String(team.leaderId || team.leader_id) === currentUserId;
  const isMember =
    team &&
    Array.isArray(team.members) &&
    team.members.some((m) => String(m.id || m.user_id) === currentUserId);
  const myReqType = team?.myRequestType || team?.my_request_type || 'request';
  const myReqId = team?.myRequestId || team?.my_request_id;
  const myReqStatus = team?.myRequestStatus || team?.my_request_status;
  const isInvited = team && !isLeader && !isMember && myReqType === 'invite' && myReqStatus === 'pending';
  const hasPendingRequest =
    team && !isLeader && !isMember && !isInvited && (team.hasPendingRequest || myReqStatus === 'pending');
  const isFull = team && (team.status === 'full' || (team.members?.length || 1) >= (team.maxMembers || 4));

  // --- CANDIDATE INVITE ACTIONS ---
  const handleAcceptInvite = async () => {
    if (!myReqId) return;
    setActionBusy(true);
    try {
      await respondToTeamRequest(teamId, myReqId, 'accepted');
      Alert.alert('Success', `You have joined ${team.name}!`);
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to accept invitation.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleDeclineInvite = async () => {
    if (!myReqId) return;
    setActionBusy(true);
    try {
      await respondToTeamRequest(teamId, myReqId, 'rejected');
      Alert.alert('Invitation Declined', `You declined the invitation to join ${team.name}.`);
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to decline invitation.');
    } finally {
      setActionBusy(false);
    }
  };

  // --- LEADER ACTIONS ---
  const handleAcceptRequest = async (reqId) => {
    setActionBusy(true);
    try {
      await respondToTeamRequest(teamId, reqId, 'accepted');
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to accept request.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleRejectRequest = async (reqId) => {
    setActionBusy(true);
    try {
      await respondToTeamRequest(teamId, reqId, 'rejected');
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to reject request.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleRemoveMember = (memberId, memberName) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setActionBusy(true);
            try {
              await removeTeamMember(teamId, memberId);
              loadData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to remove member.');
            } finally {
              setActionBusy(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteTeam = () => {
    Alert.alert(
      'Delete Team',
      'Are you sure you want to delete this team? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionBusy(true);
            try {
              await deleteTeam(teamId);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete team.');
              setActionBusy(false);
            }
          },
        },
      ]
    );
  };

  // --- MEMBER ACTIONS ---
  const handleLeaveTeam = () => {
    Alert.alert('Leave Team', 'Are you sure you want to leave this team?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          setActionBusy(true);
          try {
            await leaveTeam(teamId);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to leave team.');
            setActionBusy(false);
          }
        },
      },
    ]);
  };

  // --- CANDIDATE ACTIONS ---
  const handleApplyToTeam = async () => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await applyToTeam(teamId, {
        role: user?.role || 'Member',
        skills: user?.skills || '',
        notes: 'Interested in joining your hackathon team.',
      });
      Alert.alert('Success', 'Your join request has been submitted to the team leader!');
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit join request.');
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <AppShell>
      <View style={styles.screen}>
        <AppHeader title="Team Details" onBack={() => navigation.goBack()} />

        <ScreenState
          loading={loading}
          error={error}
          onRetry={loadData}
          empty={!loading && !error && !team}
          emptyMessage="Team not found."
        >
          {team ? (
            <ScrollView contentContainerStyle={styles.content}>
              {/* Main Team Info Card */}
              <Card padding="lg" style={styles.card}>
                <View style={styles.headerRow}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  <StatusBadge
                    status={!isFull ? 'vacant' : 'full'}
                    label={!isFull ? 'Vacant' : 'Full'}
                  />
                </View>

                {/* Hackathon Name Kicker */}
                <Text style={styles.hackathonTag}>{team.hackathon.toUpperCase()}</Text>

                {/* Capacity */}
                <Text style={styles.capacity}>
                  {team.members?.length || 1} / {team.maxMembers || 4} members
                </Text>

                <View style={styles.divider} />

                {/* Description */}
                {team.description ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>About the Project</Text>
                    <Text style={styles.sectionBody}>{team.description}</Text>
                  </View>
                ) : null}

                {/* Problem Statement */}
                {team.problemStatement ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Problem Statement</Text>
                    <Text style={styles.sectionBody}>{team.problemStatement}</Text>
                  </View>
                ) : null}

                <View style={styles.divider} />

                {/* Team Leader */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Team Leader</Text>
                  <View style={styles.leaderRow}>
                    <Avatar name={team.leaderName} size={40} style={styles.avatar} />
                    <View style={styles.leaderInfo}>
                      <Text style={styles.leaderName}>{formatFullName(team.leaderName) || team.leaderName || 'Team Leader'}</Text>
                      <Text style={styles.leaderMeta}>Team Lead</Text>
                    </View>
                  </View>
                </View>

                {/* Current Members */}
                {Array.isArray(team.members) && team.members.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Current Members</Text>
                    {team.members.map((member) => {
                      const isMemberLead = String(member.id) === String(team.leaderId);
                      if (isMemberLead) return null; // Leader shown separately
                      const memberDisplayName = formatFullName(member.name) || member.name || 'Member';
                      return (
                        <View key={member.id} style={styles.memberItemRow}>
                          <Avatar name={member.name} size={28} style={styles.memberAvatar} />
                          <View style={styles.memberInfo}>
                            <Text style={styles.memberItemName}>{memberDisplayName}</Text>
                            <Text style={styles.memberItemRole}>{member.role || 'Member'}</Text>
                          </View>
                          {isLeader ? (
                            <Pressable
                              onPress={() => handleRemoveMember(member.id, member.name)}
                              style={styles.removeBtn}
                              hitSlop={8}
                            >
                              <Text style={styles.removeBtnText}>Remove</Text>
                            </Pressable>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                ) : null}

                <View style={styles.divider} />

                {/* Skills & Tech */}
                {team.skills ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Skills Required</Text>
                    <Text style={styles.tagList}>
                      {Array.isArray(team.skills) ? team.skills.join(' · ') : team.skills}
                    </Text>
                  </View>
                ) : null}

                {team.techStack ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Tech Stack</Text>
                    <Text style={styles.tagList}>
                      {Array.isArray(team.techStack) ? team.techStack.join(' · ') : team.techStack}
                    </Text>
                  </View>
                ) : null}

                {/* Contact Info */}
                {team.contact ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Leader Contact</Text>
                    <Text style={styles.contactText}>{team.contact}</Text>
                  </View>
                ) : null}
              </Card>

              {/* Dynamic Action Area */}
              {isLeader ? (
                /* Leader Controls: View Join Requests & Delete Team */
                <View style={styles.leaderActions}>
                  {requests.length > 0 ? (
                    <View style={styles.section}>
                      <Text style={styles.sectionLabel}>
                        Pending Join Requests ({requests.filter((r) => r.status === 'pending').length})
                      </Text>
                      {requests.map((req) => (
                        <TeamRequestCard
                          key={req.id}
                          request={req}
                          busy={actionBusy}
                          onAccept={() => handleAcceptRequest(req.id)}
                          onReject={() => handleRejectRequest(req.id)}
                        />
                      ))}
                    </View>
                  ) : null}

                  <View style={styles.deleteSpacer} />

                  <PrimaryButton
                    label="Delete Team"
                    tone="destructive"
                    loading={actionBusy}
                    loadingLabel="Deleting..."
                    onPress={handleDeleteTeam}
                    style={styles.actionBtn}
                  />
                </View>
              ) : isMember ? (
                /* Member Controls: Leave Team */
                <View style={styles.memberActions}>
                  <Text style={styles.memberStatusText}>YOU ARE A TEAM MEMBER</Text>
                  <PrimaryButton
                    label="Leave Team"
                    tone="destructive"
                    loading={actionBusy}
                    loadingLabel="Leaving..."
                    onPress={handleLeaveTeam}
                    style={styles.actionBtn}
                  />
                </View>
              ) : isInvited ? (
                /* Candidate with Pending Invitation from Leader */
                <Card padding="lg" style={styles.card}>
                  <Text style={styles.pendingNoticeTitle}>Team Invitation</Text>
                  <Text style={styles.pendingNoticeBody}>
                    {team.leaderName || team.leader_name || 'The team leader'} invited you to join this team as {team.myRequestRole || team.my_request_role || 'Member'}.
                  </Text>
                  <View style={styles.inviteBtnRow}>
                    <PrimaryButton
                      label="Accept Invite"
                      tone="primary"
                      loading={actionBusy}
                      loadingLabel="Joining..."
                      onPress={handleAcceptInvite}
                      style={styles.inviteActionBtn}
                    />
                    <PrimaryButton
                      label="Decline"
                      tone="destructive"
                      loading={actionBusy}
                      loadingLabel="Declining..."
                      onPress={handleDeclineInvite}
                      style={styles.inviteActionBtn}
                    />
                  </View>
                </Card>
              ) : hasPendingRequest ? (
                /* Candidate with Pending Request */
                <Card padding="lg" style={styles.card}>
                  <Text style={styles.pendingNoticeTitle}>Request Submitted</Text>
                  <Text style={styles.pendingNoticeBody}>
                    Your application to join this team is currently under review by the team leader.
                  </Text>
                  <Text style={styles.statusPendingBadge}>PENDING</Text>
                </Card>
              ) : (
                /* Candidate / Outsider: Apply to Join */
                <Card padding="lg" style={styles.card}>
                  <Text style={styles.joinHeading}>Interested in joining this team?</Text>
                  <PrimaryButton
                    label={isFull ? 'Team is Full' : 'Request to Join Team'}
                    tone="primary"
                    disabled={isFull || actionBusy}
                    loading={actionBusy}
                    loadingLabel="Submitting..."
                    onPress={handleApplyToTeam}
                  />
                </Card>
              )}
            </ScrollView>
          ) : null}
        </ScreenState>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  teamName: {
    ...typography.heading,
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
    flex: 1,
    marginRight: spacing.sm,
  },
  hackathonTag: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  capacity: {
    ...typography.caption,
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionBody: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.foreground,
  },
  tagList: {
    ...typography.body,
    fontSize: 14,
    color: colors.foreground,
  },
  contactText: {
    ...typography.body,
    fontSize: 14,
    color: colors.foreground,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  avatar: {
    marginRight: 10,
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
  },
  leaderMeta: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  memberItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  memberAvatar: {
    marginRight: 10,
  },
  memberInfo: {
    flex: 1,
  },
  memberItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  memberItemRole: {
    ...typography.caption,
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  removeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.destructiveSoft,
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.destructive,
  },
  leaderActions: {
    marginTop: spacing.xs,
  },
  deleteSpacer: {
    height: spacing.sm,
  },
  memberActions: {
    marginTop: spacing.xs,
  },
  memberStatusText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: 0.6,
  },
  pendingNoticeTitle: {
    ...typography.heading,
    fontSize: 16,
    color: colors.foreground,
    marginBottom: 4,
  },
  pendingNoticeBody: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.mutedForeground,
    marginBottom: spacing.sm,
  },
  statusPendingBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  inviteBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  inviteActionBtn: {
    flex: 1,
  },
  joinHeading: {
    ...typography.heading,
    fontSize: 16,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.destructive,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
