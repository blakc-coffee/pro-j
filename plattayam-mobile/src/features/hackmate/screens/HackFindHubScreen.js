import { useCallback, useState } from 'react';
import {
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
import { getPerson, listMyTeams } from '../services/hackfind';
import AvailabilityBadge from '../components/AvailabilityBadge';

export default function HackFindHubScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const currentUserId = user?.user_id ?? user?.id;

  const [myProfile, setMyProfile] = useState(null);
  const [teamsData, setTeamsData] = useState({ leading: [], joined: [], pending: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, tRes] = await Promise.allSettled([
        currentUserId ? getPerson(currentUserId) : Promise.reject('No user'),
        listMyTeams(),
      ]);

      if (pRes.status === 'fulfilled' && pRes.value) {
        setMyProfile(pRes.value);
      } else {
        setMyProfile(null);
      }

      if (tRes.status === 'fulfilled' && tRes.value) {
        setTeamsData(tRes.value);
      }
    } catch (err) {
      setError(err.message || 'Failed to load your HackMate data.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const leadingCount = teamsData?.leading?.length || 0;
  const joinedCount = teamsData?.joined?.length || 0;
  const sentRequestsCount = teamsData?.pending?.length || 0;

  return (
    <AppShell>
      <View style={styles.screen}>
        <AppHeader
          title="My HackMate"
          subtitle="Your hackathon profile, teams & requests"
          onBack={() => navigation.goBack()}
        />

        <ScreenState loading={loading} error={error} onRetry={loadData}>
          <ScrollView contentContainerStyle={styles.content}>
            {/* 1. My Profile Card */}
            <Card padding="lg" style={styles.card}>
              <View style={styles.headerRow}>
                <View style={styles.titleWrap}>
                  <Text style={styles.kicker}>CANDIDATE PROFILE</Text>
                  <Text style={styles.cardTitle}>My Profile</Text>
                </View>
                {myProfile ? (
                  <Text style={styles.activeStatusText}>ACTIVE</Text>
                ) : (
                  <Text style={styles.noneStatusText}>NOT CREATED</Text>
                )}
              </View>

              {myProfile ? (
                <View style={styles.profileSummary}>
                  <View style={styles.profileRoleRow}>
                    <Text style={styles.profileHeadline} numberOfLines={1}>
                      {myProfile.role}
                    </Text>
                    <AvailabilityBadge status={myProfile.status} />
                  </View>
                  {myProfile.hackathon ? (
                    <Text style={styles.profileMeta}>{myProfile.hackathon}</Text>
                  ) : null}
                  {myProfile.skills ? (
                    <Text style={styles.profileSkills} numberOfLines={1}>
                      Skills: {Array.isArray(myProfile.skills) ? myProfile.skills.join(' · ') : myProfile.skills}
                    </Text>
                  ) : null}

                  <View style={styles.btnRow}>
                    <Pressable
                      onPress={() =>
                        navigation.navigate('CandidateProfile', {
                          personId: myProfile.id || currentUserId,
                          isSelf: true,
                        })
                      }
                      style={({ pressed }) => [styles.viewBtn, pressed && styles.btnPressed]}
                      accessibilityRole="button"
                    >
                      <Text style={styles.viewBtnText}>View Card</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        navigation.navigate('CreateProfileCard', { initialProfile: myProfile })
                      }
                      style={({ pressed }) => [styles.editBtn, pressed && styles.btnPressed]}
                      accessibilityRole="button"
                    >
                      <Text style={styles.editBtnText}>Edit</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.profileEmpty}>
                  <Text style={styles.emptyDesc}>
                    Create your single HackMate candidate profile card to let teams discover you.
                  </Text>
                  <Pressable
                    onPress={() => navigation.navigate('CreateProfileCard')}
                    style={({ pressed }) => [styles.createBtn, pressed && styles.btnPressed]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.createBtnText}>+ Create Profile Card</Text>
                  </Pressable>
                </View>
              )}
            </Card>

            {/* 2. My Teams Card */}
            <Card
              padding="lg"
              style={styles.card}
              onPress={() => navigation.navigate('MyTeams')}
            >
              <View style={styles.menuRow}>
                <View style={styles.titleWrap}>
                  <Text style={styles.kicker}>MEMBERSHIPS</Text>
                  <Text style={styles.cardTitle}>My Teams</Text>
                  <Text style={styles.cardSubtitle}>
                    {leadingCount} leading · {joinedCount} joined
                  </Text>
                </View>
                <Text style={styles.chevron}>→</Text>
              </View>
            </Card>

            {/* 3. Join Requests Card */}
            <Card padding="lg" style={styles.card}>
              <View style={styles.headerRow}>
                <View style={styles.titleWrap}>
                  <Text style={styles.kicker}>INCOMING</Text>
                  <Text style={styles.cardTitle}>Join Requests</Text>
                  <Text style={styles.cardSubtitle}>
                    Requests from candidates to join teams you lead
                  </Text>
                </View>
              </View>

              {leadingCount > 0 ? (
                <View style={styles.teamRequestsList}>
                  {teamsData.leading.map((team) => (
                    <View key={team.id} style={styles.teamRequestRow}>
                      <View style={styles.teamRequestInfo}>
                        <Text style={styles.teamNameText} numberOfLines={1}>
                          {team.name}
                        </Text>
                        <Text style={styles.teamHackathonText}>
                          {team.hackathon}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() =>
                          navigation.navigate('TeamRequests', {
                            teamId: team.id,
                            teamName: team.name,
                          })
                        }
                        style={({ pressed }) => [styles.manageRequestsBtn, pressed && styles.btnPressed]}
                        accessibilityRole="button"
                      >
                        <Text style={styles.manageRequestsBtnText}>
                          View Requests
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyInlineWrap}>
                  <Text style={styles.emptyInlineText}>
                    You are not leading any teams yet. Create a team to receive join requests.
                  </Text>
                  <Pressable
                    onPress={() => navigation.navigate('CreateTeam')}
                    style={({ pressed }) => [styles.outlineBtn, pressed && styles.btnPressed]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.outlineBtnText}>+ Create a Team</Text>
                  </Pressable>
                </View>
              )}
            </Card>

            {/* 4. Sent Requests Card */}
            <Card
              padding="lg"
              style={styles.card}
              onPress={() => navigation.navigate('MyTeams')}
            >
              <View style={styles.menuRow}>
                <View style={styles.titleWrap}>
                  <Text style={styles.kicker}>OUTGOING</Text>
                  <Text style={styles.cardTitle}>Sent Requests</Text>
                  <Text style={styles.cardSubtitle}>
                    {sentRequestsCount === 0
                      ? 'No outgoing team applications'
                      : `${sentRequestsCount} application${sentRequestsCount === 1 ? '' : 's'} submitted`}
                  </Text>
                </View>
                <Text style={styles.chevron}>→</Text>
              </View>
            </Card>
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
  card: {
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleWrap: {
    flex: 1,
  },
  kicker: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  cardTitle: {
    ...typography.heading,
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  cardSubtitle: {
    ...typography.caption,
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chevron: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  activeStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  noneStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedForeground,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  profileSummary: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  profileRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  profileHeadline: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
    marginRight: spacing.sm,
  },
  profileMeta: {
    ...typography.caption,
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  profileSkills: {
    ...typography.caption,
    fontSize: 13,
    color: colors.foreground,
    marginTop: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  viewBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  viewBtnText: {
    color: colors.primaryForeground,
    fontSize: 13,
    fontWeight: '600',
  },
  editBtn: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  editBtnText: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: '600',
  },
  profileEmpty: {
    marginTop: spacing.sm,
  },
  emptyDesc: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.mutedForeground,
    marginBottom: spacing.sm,
  },
  createBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  createBtnText: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: '600',
  },
  teamRequestsList: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  teamRequestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  teamRequestInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  teamNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  teamHackathonText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  manageRequestsBtn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  manageRequestsBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyInlineWrap: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  emptyInlineText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.mutedForeground,
    marginBottom: spacing.sm,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.88,
  },
});
