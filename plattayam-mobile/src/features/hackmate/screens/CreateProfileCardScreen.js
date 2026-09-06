import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import AppHeader from '../../../components/AppHeader';
import AppShell from '../../../components/AppShell';
import Card from '../../../components/Card';
import FormInput from '../../../components/FormInput';
import PrimaryButton from '../../../components/PrimaryButton';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import { createProfileCard, getMyProfile, updateProfileCard } from '../services/hackfind';
import { normalizeAvailabilityStatus } from '../components/AvailabilityBadge';

export default function CreateProfileCardScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const initialProfile = route.params?.initialProfile;

  const [currentProfile, setCurrentProfile] = useState(initialProfile || null);
  const isEditing = !!currentProfile;

  const [role, setRole] = useState(initialProfile?.role || '');
  const [hackathon, setHackathon] = useState(initialProfile?.hackathon || '');
  const [skills, setSkills] = useState(
    Array.isArray(initialProfile?.skills)
      ? initialProfile.skills.join(', ')
      : initialProfile?.skills || ''
  );
  const [techStack, setTechStack] = useState(
    Array.isArray(initialProfile?.techStack || initialProfile?.tech_stack)
      ? (initialProfile.techStack || initialProfile.tech_stack).join(', ')
      : initialProfile?.techStack || initialProfile?.tech_stack || ''
  );
  const [experience, setExperience] = useState(initialProfile?.experience || '');
  const [about, setAbout] = useState(initialProfile?.about || '');
  const [portfolio, setPortfolio] = useState(initialProfile?.portfolio || '');
  const [contact, setContact] = useState(initialProfile?.contact || '');
  const [status, setStatus] = useState(
    normalizeAvailabilityStatus(initialProfile?.status) || 'open'
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If user opens create screen without initialProfile, verify if they already have one
  useEffect(() => {
    let active = true;
    if (!initialProfile) {
      getMyProfile()
        .then((profile) => {
          if (!active || !profile) return;
          setCurrentProfile(profile);
          setRole(profile.role || '');
          setHackathon(profile.hackathon || '');
          setSkills(
            Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills || ''
          );
          setTechStack(
            Array.isArray(profile.techStack || profile.tech_stack)
              ? (profile.techStack || profile.tech_stack).join(', ')
              : profile.techStack || profile.tech_stack || ''
          );
          setExperience(profile.experience || '');
          setAbout(profile.about || '');
          setPortfolio(profile.portfolio || '');
          setContact(profile.contact || '');
          setStatus(normalizeAvailabilityStatus(profile.status) || 'open');
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [initialProfile]);

  const handleSubmit = async () => {
    if (!role.trim()) {
      setError('Primary Role is required.');
      return;
    }
    if (!skills.trim()) {
      setError('Key Skills is required.');
      return;
    }
    if (!contact.trim()) {
      setError('Contact Info is required.');
      return;
    }

    setError('');
    setLoading(true);

    const payload = {
      role: role.trim(),
      hackathon: hackathon.trim() || undefined,
      skills: skills.trim(),
      tech_stack: techStack.trim() || undefined,
      experience: experience.trim() || undefined,
      about: about.trim() || undefined,
      portfolio: portfolio.trim() || undefined,
      contact: contact.trim(),
      status: status === 'occupied' ? 'occupied' : 'open',
    };

    try {
      if (isEditing) {
        await updateProfileCard(currentProfile.id || currentProfile.userId, payload);
      } else {
        await createProfileCard(payload);
      }

      Alert.alert(
        isEditing ? 'Profile Updated' : 'Profile Published',
        isEditing
          ? 'Your candidate profile card has been updated successfully.'
          : 'Your candidate profile card is now live on the HackMate marketplace!',
        [
          {
            text: 'Great',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      setError(err.message || (isEditing ? 'Failed to update profile card.' : 'Failed to publish profile card.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <View style={styles.screen}>
        <AppHeader
          title={isEditing ? 'Edit Profile Card' : 'Create Profile Card'}
          onBack={() => navigation.goBack()}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.content}>
            <Card padding="lg" style={styles.card}>
              <Text style={styles.sectionHeader}>PROFESSIONAL INFO</Text>

              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <FormInput
                label="Primary Role / Title *"
                placeholder="e.g. Frontend Developer, AI/ML Researcher"
                value={role}
                onChangeText={setRole}
              />

              <FormInput
                label="Target Hackathon"
                placeholder="e.g. Smart India Hackathon 2026 (or leave blank for any)"
                value={hackathon}
                onChangeText={setHackathon}
              />

              <FormInput
                label="Key Skills (comma-separated) *"
                placeholder="e.g. React Native, TypeScript, UI Design"
                value={skills}
                onChangeText={setSkills}
              />

              <FormInput
                label="Tech Stack (comma-separated)"
                placeholder="e.g. FastAPI, Docker, Tailwind CSS, PyTorch"
                value={techStack}
                onChangeText={setTechStack}
              />

              <FormInput
                label="Experience Level"
                placeholder="e.g. 2+ years React, Built 3 hackathon projects"
                value={experience}
                onChangeText={setExperience}
              />

              {/* Availability Status Selector */}
              <View style={styles.statusFieldGroup}>
                <Text style={styles.fieldLabel}>Availability Status</Text>
                <View style={styles.statusSelectorRow}>
                  <Pressable
                    onPress={() => setStatus('open')}
                    style={[
                      styles.statusOption,
                      status === 'open'
                        ? styles.statusOptionOpenActive
                        : styles.statusOptionInactive,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: status === 'open' }}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        status === 'open'
                          ? styles.statusOptionTextOpenActive
                          : styles.statusOptionTextInactive,
                      ]}
                    >
                      Open to Work
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setStatus('occupied')}
                    style={[
                      styles.statusOption,
                      status === 'occupied'
                        ? styles.statusOptionOccupiedActive
                        : styles.statusOptionInactive,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: status === 'occupied' }}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        status === 'occupied'
                          ? styles.statusOptionTextOccupiedActive
                          : styles.statusOptionTextInactive,
                      ]}
                    >
                      Occupied
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.statusHint}>
                  {status === 'open'
                    ? '• Available to join a hackathon or team'
                    : '• Currently committed to a team or project'}
                </Text>
              </View>

              <Text style={styles.sectionHeader}>ABOUT & CONTACT</Text>

              <FormInput
                label="About You / Bio"
                placeholder="Brief pitch about yourself, what you like building, and what kind of team you are looking for."
                value={about}
                onChangeText={setAbout}
                multiline
                numberOfLines={3}
              />

              <FormInput
                label="Portfolio / GitHub / LinkedIn"
                placeholder="https://github.com/yourhandle"
                value={portfolio}
                onChangeText={setPortfolio}
                autoCapitalize="none"
              />

              <FormInput
                label="Contact Info *"
                placeholder="Phone number, email, or @handle"
                value={contact}
                onChangeText={setContact}
              />

              <View style={styles.btnRow}>
                <PrimaryButton
                  label={isEditing ? 'Save Changes' : 'Publish Profile Card'}
                  tone="primary"
                  loading={loading}
                  disabled={loading}
                  onPress={handleSubmit}
                />
              </View>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  btnRow: {
    marginTop: spacing.md,
  },
  errorBanner: {
    backgroundColor: colors.destructiveSoft,
    borderColor: colors.destructive,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.destructive,
    textAlign: 'center',
  },
  statusFieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  statusSelectorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOptionOpenActive: {
    backgroundColor: colors.successSoft,
  },
  statusOptionOccupiedActive: {
    backgroundColor: colors.warningSoft,
  },
  statusOptionInactive: {
    backgroundColor: '#f7f5f2',
    borderWidth: 1,
    borderColor: '#e8e3dc',
  },
  statusOptionText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statusOptionTextOpenActive: {
    color: colors.success,
  },
  statusOptionTextOccupiedActive: {
    color: colors.warning,
  },
  statusOptionTextInactive: {
    color: colors.mutedForeground,
  },
  statusHint: {
    ...typography.caption,
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 6,
  },
});
