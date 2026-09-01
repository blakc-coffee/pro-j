import { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
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
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import { useAuth } from '../../../context/AuthContext';
import { getPerson } from '../services/hackfind';
import { formatFullName } from '../../../utils/format';

export default function CandidateProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const currentUserId = String(user?.user_id ?? user?.id ?? '');

  const personId = route.params?.personId;

  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Team invite modal
  const [inviteModalVisible, setInviteModalVisible] = useState(false);

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

  const handleSendInvite = (teamName) => {
    setInviteModalVisible(false);
    Alert.alert(
      'Invitation Sent!',
      `An invitation notification has been sent to ${person?.name}!`,
      [{ text: 'Great' }]
    );
  };

  const isOpen = person?.status === 'open_to_join';
  const isSelf =
    route.params?.isSelf ||
    (person && String(person.userId || person.user_id || '') === currentUserId);
  const displayName = formatFullName(person?.name) || person?.name || 'Candidate';
  const rollText = person?.roll_no || person?.rollNo || '';

  return (
    <AppShell>
      <View style={styles.screen}>
        <AppHeader
          title={isSelf ? 'My Profile' : 'Candidate Profile'}
          onBack={() => navigation.goBack()}
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
                {/* Header Row: Avatar + Name + Roll */}
                <View style={styles.userRow}>
                  <Avatar name={person.name} size={48} style={styles.avatar} />
                  <View style={styles.userInfo}>
                    <Text style={styles.name}>{displayName}</Text>
                    {rollText ? <Text style={styles.rollNo}>{rollText}</Text> : null}
                  </View>
                </View>

                {/* Role + Status Row */}
                <View style={styles.roleRow}>
                  <Text style={styles.role}>{person.role}</Text>
                  <Text style={[styles.statusText, isOpen ? styles.statusOpen : styles.statusFound]}>
                    {isOpen ? 'OPEN TO JOIN' : 'TEAM FOUND'}
                  </Text>
                </View>

                {/* Hackathon Event Tag */}
                {person.hackathon ? (
                  <Text style={styles.hackathonTag}>{person.hackathon.toUpperCase()}</Text>
                ) : null}

                <View style={styles.divider} />

                {/* About / Pitch */}
                {person.about ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>About</Text>
                    <Text style={styles.sectionBody}>{person.about}</Text>
                  </View>
                ) : null}

                {/* Skills */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Skills</Text>
                  <Text style={styles.tagList}>
                    {Array.isArray(person.skills) ? person.skills.join(' · ') : person.skills}
                  </Text>
                </View>

                {/* Tech Stack */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Tech Stack</Text>
                  <Text style={styles.tagList}>
                    {Array.isArray(person.techStack)
                      ? person.techStack.join(' · ')
                      : person.techStack}
                  </Text>
                </View>

                {/* Experience */}
                {person.experience ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Experience</Text>
                    <Text style={styles.sectionBody}>{person.experience}</Text>
                  </View>
                ) : null}

                {/* Portfolio / Links */}
                {person.portfolio ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Portfolio / GitHub</Text>
                    <Text style={styles.linkText}>{person.portfolio}</Text>
                  </View>
                ) : null}

                {/* Contact */}
                {person.contact ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Contact</Text>
                    <Text style={styles.sectionBody}>{person.contact}</Text>
                  </View>
                ) : null}
              </Card>

              {/* Action Area */}
              <View style={styles.actions}>
                {isSelf ? (
                  <PrimaryButton
                    label="Edit Profile Card"
                    tone="primary"
                    onPress={() =>
                      navigation.navigate('CreateProfileCard', { initialProfile: person })
                    }
                  />
                ) : (
                  <>
                    <PrimaryButton
                      label="Invite to Your Team"
                      tone="primary"
                      disabled={!isOpen}
                      onPress={() => setInviteModalVisible(true)}
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

        {/* Team Invite Modal */}
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

              <Pressable
                onPress={() => handleSendInvite('AlgoRhythm')}
                style={({ pressed }) => [styles.teamOption, pressed && styles.btnPressed]}
                accessibilityRole="button"
              >
                <Text style={styles.teamOptionName}>AlgoRhythm</Text>
                <Text style={styles.teamOptionMeta}>Smart India Hackathon 2026</Text>
              </Pressable>

              <Pressable
                onPress={() => handleSendInvite('Web3 Mavericks')}
                style={({ pressed }) => [styles.teamOption, pressed && styles.btnPressed]}
                accessibilityRole="button"
              >
                <Text style={styles.teamOptionName}>Web3 Mavericks</Text>
                <Text style={styles.teamOptionMeta}>ETHIndia 2026</Text>
              </Pressable>

              <View style={styles.modalBtnRow}>
                <Pressable
                  onPress={() => setInviteModalVisible(false)}
                  style={styles.cancelModalBtn}
                  accessibilityRole="button"
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
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statusOpen: {
    color: colors.success, // #107c41
  },
  statusFound: {
    color: colors.mutedForeground, // #716b61
  },
  hackathonTag: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent, // #cd2f7b
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
  teamOption: {
    backgroundColor: '#f7f5f2',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
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
