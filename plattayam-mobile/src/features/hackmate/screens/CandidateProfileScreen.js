import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import AppHeader from '../../../components/AppHeader';
import AppShell from '../../../components/AppShell';
import Avatar from '../../../components/Avatar';
import Card from '../../../components/Card';
import PrimaryButton from '../../../components/PrimaryButton';
import ScreenState from '../../../components/ScreenState';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import { useAuth } from '../../../context/AuthContext';
import { getPerson, inviteCandidateToTeam, listMyTeams } from '../services/hackfind';
import { formatFullName } from '../../../utils/format';
import AvailabilityBadge, { normalizeAvailabilityStatus } from '../components/AvailabilityBadge';

export default function CandidateProfileScreen({ navigation, route }) {
  const { user } = useAuth();
  const currentUserId = String(user?.user_id ?? user?.id ?? '');

  const personId = route?.params?.personId;

  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Team invite modal & state
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [myTeams, setMyTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamsError, setTeamsError] = useState('');
  const [invitingTeamId, setInvitingTeamId] = useState(null);

  const loadData = useCallback(async () => {
    if (!personId) return;
    setLoading(true);
    setError('');
    try {
      const res = await getPerson(personId);
      setPerson(res);
    } catch (err) {
      setError(err.message || 'Failed to load candidate profile.');
    } finally {
      setLoading(false);
    }
  }, [personId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const isSelf =
    route?.params?.isSelf ||
    (person && String(person.userId || person.user_id || '') === currentUserId);
  const isOpen = normalizeAvailabilityStatus(person?.status) === 'open';
  const displayName = formatFullName(person?.name) || person?.name || 'Candidate';
  const rollText = person?.roll_no || person?.rollNo || '';

  const openInviteModal = async () => {
    if (!isOpen) return;
    setInviteModalVisible(true);
    setLoadingTeams(true);
    setTeamsError('');
    try {
      const data = await listMyTeams();
      const leading = Array.isArray(data?.leading) ? data.leading : [];
      const joined = Array.isArray(data?.joined) ? data.joined : [];
      const allTeamsMap = new Map();
      leading.forEach((t) => allTeamsMap.set(String(t.id), t));
      joined.forEach((t) => {
        if (!allTeamsMap.has(String(t.id))) allTeamsMap.set(String(t.id), t);
      });
      setMyTeams(Array.from(allTeamsMap.values()));
    } catch (err) {
      setTeamsError(err.message || 'Failed to load your teams.');
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleSendInvite = async (team) => {
    if (!team?.id || invitingTeamId) return;
    const targetUserId = person?.userId ?? person?.user_id ?? personId;
    if (!targetUserId) {
      Alert.alert('Error', 'Candidate user ID not found.');
      return;
    }
    setInvitingTeamId(team.id);
    try {
      await inviteCandidateToTeam(team.id, {
        userId: targetUserId,
        role: person?.role || 'Member',
        notes: `Recruitment invitation to join ${team.name}`,
      });
      setInviteModalVisible(false);
      Alert.alert(
        'Invitation Sent!',
        `An invitation to join "${team.name}" has been sent to ${person?.name || 'the candidate'}!`,
        [{ text: 'Great' }]
      );
    } catch (err) {
      Alert.alert('Could Not Send Invitation', err.message || 'Failed to send invitation.');
    } finally {
      setInvitingTeamId(null);
    }
  };

  return (
    <AppShell>
      <View style={styles.screen}>
        <AppHeader
          title={isSelf ? 'My Profile' : 'Candidate Profile'}
          onBack={() => navigation?.goBack()}
        />

        <ScreenState
          loading={loading}
          error={error}
          onRetry={loadData}
          empty={!loading && !error && !person}
          emptyMessage="Candidate not found."
        >
          {person ? (
            <ScrollView contentContainerStyle={styles.content}>
              <Card padding="lg" style={styles.card}>
                <View style={styles.userRow}>
                  <Avatar name={person.name} size={48} style={styles.avatar} />
                  <View style={styles.userInfo}>
                    <Text style={styles.name}>{displayName}</Text>
                    {rollText ? <Text style={styles.rollNo}>{rollText}</Text> : null}
                  </View>
                </View>

                <View style={styles.roleRow}>
                  <Text style={styles.role}>{person.role}</Text>
                  <AvailabilityBadge status={person?.status} />
                </View>

                {person.hackathon ? (
                  <Text style={styles.hackathonTag}>{person.hackathon.toUpperCase()}</Text>
                ) : null}

                <View style={styles.divider} />

                {person.about ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>About</Text>
                    <Text style={styles.sectionBody}>{person.about}</Text>
                  </View>
                ) : null}

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Skills</Text>
                  <Text style={styles.tagList}>
                    {Array.isArray(person.skills) ? person.skills.join(' · ') : person.skills}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Tech Stack</Text>
                  <Text style={styles.tagList}>
                    {Array.isArray(person.techStack)
                      ? person.techStack.join(' · ')
                      : person.techStack}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Experience</Text>
                  <Text style={styles.sectionBody}>{person.experience}</Text>
                </View>

                {person.portfolio ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Portfolio / GitHub</Text>
                    <Text style={styles.linkText}>{person.portfolio}</Text>
                  </View>
                ) : null}

                {person.contact ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Contact</Text>
                    <Text style={styles.sectionBody}>{person.contact}</Text>
                  </View>
                ) : null}
              </Card>

              <View style={styles.actions}>
                {isSelf ? (
                  <PrimaryButton
                    label="Edit Profile Card"
                    tone="primary"
                    onPress={() =>
                      navigation?.navigate('CreateProfileCard', { initialProfile: person })
                    }
                  />
                ) : (
                  <>
                    <PrimaryButton
                      label="Invite to Your Team"
                      tone="primary"
                      disabled={!isOpen}
                      onPress={openInviteModal}
                    />

                    {person.contact ? (
                      <View style={styles.contactSpacer}>
                        <PrimaryButton
                          label={`Contact: ${person.contact}`}
                          tone="secondary"
                          onPress={() => {
                            Alert.alert('Contact Candidate', `You can reach ${person.name} at:\n${person.contact}`);
                          }}
                        />
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            </ScrollView>
          ) : null}
        </ScreenState>

        <Modal
          visible={inviteModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setInviteModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Invite {person?.name}</Text>
              <Text style={styles.modalSubtitle}>
                Select one of your teams to send a recruitment invitation:
              </Text>

              {loadingTeams ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.modalLoadingText}>Loading your teams...</Text>
                </View>
              ) : teamsError ? (
                <View style={styles.modalErrorContainer}>
                  <Text style={styles.modalErrorText}>{teamsError}</Text>
                  <PrimaryButton
                    label="Retry"
                    tone="secondary"
                    onPress={openInviteModal}
                    style={styles.retryBtn}
                  />
                </View>
              ) : myTeams.length === 0 ? (
                <View style={styles.noTeamsWrap}>
                  <Text style={styles.noTeamsTitle}>You have no teams yet</Text>
                  <Text style={styles.noTeamsSubtitle}>
                    Create a hackathon team first to recruit and invite candidates.
                  </Text>
                  <PrimaryButton
                    label="Create a Team"
                    tone="primary"
                    onPress={() => {
                      setInviteModalVisible(false);
                      navigation?.navigate('CreateTeam');
                    }}
                    style={styles.createTeamModalBtn}
                  />
                </View>
              ) : (
                <ScrollView style={styles.teamsListScroll} showsVerticalScrollIndicator={false}>
                  {myTeams.map((team) => {
                    const isInvitingThis = invitingTeamId === team.id;
                    const memberCount = team.members?.length || 1;
                    const maxCap = team.maxMembers || team.max_members || 4;
                    const isTeamFull = memberCount >= maxCap;

                    return (
                      <Pressable
                        key={String(team.id)}
                        onPress={() => handleSendInvite(team)}
                        disabled={!!invitingTeamId || isTeamFull}
                        style={({ pressed }) => [
                          styles.teamOption,
                          isTeamFull && styles.teamOptionDisabled,
                          pressed && styles.btnPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Invite to ${team.name}`}
                      >
                        <View style={styles.teamOptionContent}>
                          <Text style={styles.teamOptionName}>{team.name}</Text>
                          <Text style={styles.teamOptionMeta}>
                            {team.hackathon} • {memberCount}/{maxCap} members {isTeamFull ? '(Full)' : ''}
                          </Text>
                        </View>
                        {isInvitingThis ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <Text style={styles.teamOptionArrow}>→</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              <View style={styles.modalBtnRow}>
                <Pressable
                  onPress={() => setInviteModalVisible(false)}
                  style={styles.cancelModalBtn}
                  disabled={!!invitingTeamId}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel invite"
                >
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    marginRight: spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    ...typography.heading,
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  rollNo: {
    ...typography.caption,
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
  },
  hackathonTag: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
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
  linkText: {
    ...typography.body,
    fontSize: 14,
    color: colors.primary,
  },
  actions: {
    marginTop: spacing.xs,
  },
  contactSpacer: {
    marginTop: spacing.sm,
  },
  btnPressed: {
    opacity: 0.88,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 420,
  },
  modalTitle: {
    ...typography.heading,
    fontSize: 18,
    color: colors.foreground,
    marginBottom: 4,
  },
  modalSubtitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.mutedForeground,
    marginBottom: spacing.md,
  },
  modalLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  modalLoadingText: {
    ...typography.body,
    fontSize: 14,
    color: colors.mutedForeground,
  },
  modalErrorContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  modalErrorText: {
    ...typography.caption,
    color: colors.destructive,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  retryBtn: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  noTeamsWrap: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  noTeamsTitle: {
    ...typography.subheading,
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 4,
  },
  noTeamsSubtitle: {
    ...typography.caption,
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  createTeamModalBtn: {
    width: '100%',
  },
  teamsListScroll: {
    maxHeight: 280,
  },
  teamOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f7f5f2',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  teamOptionContent: {
    flex: 1,
  },
  teamOptionDisabled: {
    opacity: 0.5,
  },
  teamOptionName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
  },
  teamOptionMeta: {
    ...typography.caption,
    fontSize: 12,
    color: colors.accent,
    marginTop: 2,
  },
  teamOptionArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  modalBtnRow: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  cancelModalBtn: {
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
  },
  cancelModalBtnText: {
    ...typography.body,
    color: colors.mutedForeground,
    fontWeight: '600',
  },
});
