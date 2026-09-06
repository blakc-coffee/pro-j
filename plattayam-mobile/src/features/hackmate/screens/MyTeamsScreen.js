import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import AppHeader from '../../../components/AppHeader';
import AppShell from '../../../components/AppShell';
import Card from '../../../components/Card';
import ScreenState from '../../../components/ScreenState';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import { useAuth } from '../../../context/AuthContext';
import { leaveTeam, listMyTeams } from '../services/hackfind';

export default function MyTeamsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const currentUserId = String(user?.user_id ?? user?.id ?? '');

  const [data, setData] = useState({ leading: [], joined: [], pending: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listMyTeams();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load your teams.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleLeaveTeam = (teamId, teamName) => {
    Alert.alert('Leave Team', `Are you sure you want to leave ${teamName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          setBusyId(teamId);
          try {
            await leaveTeam(teamId);
            loadData();
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to leave team.');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  const leading = data.leading || [];
  const joined = data.joined || [];
  const pending = data.pending || [];

  const isEmpty = leading.length === 0 && joined.length === 0 && pending.length === 0;

  return (
    <AppShell>
      <View style={styles.screen}>
        <AppHeader
          title="My Teams"
          onBack={() => navigation.goBack()}
          actionLabel="+ Create Team"
          onAction={() => navigation.navigate('CreateTeam')}
        />

        <ScreenState
          loading={loading}
          error={error}
          onRetry={loadData}
          empty={isEmpty}
          emptyMessage="You have not created or joined any hackathon teams yet."
        >
          <ScrollView contentContainerStyle={styles.content}>
            {/* Section 1: Teams You Lead */}
            <Text style={styles.sectionTitle}>Teams You Lead</Text>
            {leading.length === 0 ? (
              <Text style={styles.emptyText}>You are not leading any teams yet.</Text>
            ) : (
              leading.map((team) => (
                <Card key={team.id} padding="lg" style={styles.card}>
                  <View style={styles.topRow}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Text style={styles.statusLead}>TEAM LEADER</Text>
                  </View>

                  {team.hackathon ? (
                    <Text style={styles.hackathonTag}>{team.hackathon.toUpperCase()}</Text>
                  ) : null}
                  <Text style={styles.capacity}>
                    Capacity: {team.members?.length || 1} / {team.maxMembers || team.max_members || 4} members
                  </Text>

                  <View style={styles.btnRow}>
                    <Pressable
                      onPress={() =>
                        navigation.navigate('TeamRequests', {
                          teamId: team.id,
                          teamName: team.name,
                        })
                      }
                      style={styles.requestBtn}
                      accessibilityRole="button"
                    >
                      <Text style={styles.requestBtnText}>Join Requests</Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        navigation.navigate('TeamDetails', { teamId: team.id })
                      }
                      style={styles.viewBtn}
                      accessibilityRole="button"
                    >
                      <Text style={styles.viewBtnText}>Manage Team</Text>
                    </Pressable>
                  </View>
                </Card>
              ))
            )}

            {/* Section 2: Teams You Joined */}
            <Text style={styles.sectionTitle}>Teams You Joined</Text>
            {joined.length === 0 ? (
              <Text style={styles.emptyText}>You haven't joined any teams as a member yet.</Text>
            ) : (
              joined.map((team) => (
                <Card key={team.id} padding="lg" style={styles.card}>
                  <View style={styles.topRow}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Text style={styles.statusMember}>MEMBER</Text>
                  </View>

                  {team.hackathon ? (
                    <Text style={styles.hackathonTag}>{team.hackathon.toUpperCase()}</Text>
                  ) : null}
                  <Text style={styles.capacity}>
                    Leader: {team.leaderName || team.leader_name || 'Team Leader'} · {team.members?.length || 1} / {team.maxMembers || team.max_members || 4} members
                  </Text>

                  <View style={styles.btnRow}>
                    <Pressable
                      onPress={() =>
                        navigation.navigate('TeamDetails', { teamId: team.id })
                      }
                      style={styles.viewBtn}
                      accessibilityRole="button"
                    >
                      <Text style={styles.viewBtnText}>View Details</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleLeaveTeam(team.id, team.name)}
                      disabled={busyId === team.id}
                      style={styles.leaveBtn}
                      accessibilityRole="button"
                    >
                      <Text style={styles.leaveBtnText}>
                        {busyId === team.id ? 'Leaving...' : 'Leave Team'}
                      </Text>
                    </Pressable>
                  </View>
                </Card>
              ))
            )}

            {/* Section 3: Pending Applications */}
            {pending.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Pending Applications</Text>
                {pending.map((item) => {
                  const rawStatus = item.status || item.request?.status;
                  const status = (rawStatus ? String(rawStatus) : 'pending').toLowerCase();
                  const teamName = item.teamName || item.team?.name || 'Team';
                  const teamHackathon =
                    item.teamHackathon ||
                    item.team?.hackathon ||
                    item.team_hackathon ||
                    '';
                  const roleApplied = item.role || item.request?.role || 'Applicant';
                  const teamId =
                    item.teamId ||
                    item.team?.id ||
                    item.team_id ||
                    item.request?.teamId ||
                    item.request?.team_id;
                  const itemId = String(
                    item.id || item.request?.id || `${teamId}-${roleApplied}`
                  );

                  return (
                    <Card key={itemId} padding="lg" style={styles.card}>
                      <View style={styles.topRow}>
                        <Text style={styles.teamName}>{teamName}</Text>
                        <Text
                          style={[
                            styles.statusBadgeText,
                            status === 'accepted'
                              ? styles.statusAccepted
                              : status === 'rejected'
                              ? styles.statusRejected
                              : styles.statusPending,
                          ]}
                        >
                          {status.toUpperCase()}
                        </Text>
                      </View>

                      {teamHackathon ? (
                        <Text style={styles.hackathonTag}>{teamHackathon.toUpperCase()}</Text>
                      ) : null}
                      <Text style={styles.roleApplied}>Applied as: {roleApplied}</Text>

                      <View style={styles.btnRow}>
                        <Pressable
                          onPress={() => {
                            if (teamId) {
                              navigation.navigate('TeamDetails', { teamId });
                            }
                          }}
                          style={styles.viewBtn}
                          accessibilityRole="button"
                        >
                          <Text style={styles.viewBtnText}>View Team</Text>
                        </Pressable>
                      </View>
                    </Card>
                  );
                })}
              </>
            ) : null}
          </ScrollView>
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
  sectionTitle: {
    ...typography.heading,
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    fontSize: 13,
    color: colors.mutedForeground,
    marginBottom: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  teamName: {
    ...typography.heading,
    fontSize: 17,
    fontWeight: '700',
    color: colors.foreground,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusLead: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statusMember: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statusPending: {
    color: colors.warning,
  },
  statusAccepted: {
    color: colors.success,
  },
  statusRejected: {
    color: colors.destructive,
  },
  hackathonTag: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  capacity: {
    ...typography.caption,
    fontSize: 13,
    color: colors.mutedForeground,
    marginBottom: spacing.md,
  },
  roleApplied: {
    ...typography.caption,
    fontSize: 13,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  requestBtn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
  },
  requestBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  viewBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
  },
  viewBtnText: {
    color: colors.primaryForeground,
    fontSize: 13,
    fontWeight: '600',
  },
  leaveBtn: {
    backgroundColor: colors.destructiveSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
  },
  leaveBtnText: {
    color: colors.destructive,
    fontSize: 13,
    fontWeight: '600',
  },
});
