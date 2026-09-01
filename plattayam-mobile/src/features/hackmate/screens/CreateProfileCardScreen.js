import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { createProfileCard } from '../services/hackfind';

export default function CreateProfileCardScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const initialProfile = route.params?.initialProfile;
  const isEditing = !!initialProfile;

  const [role, setRole] = useState(initialProfile?.role || '');
  const [hackathon, setHackathon] = useState(initialProfile?.hackathon || '');
  const [skills, setSkills] = useState(
    Array.isArray(initialProfile?.skills)
      ? initialProfile.skills.join(', ')
      : initialProfile?.skills || ''
  );
  const [techStack, setTechStack] = useState(
    Array.isArray(initialProfile?.techStack)
      ? initialProfile.techStack.join(', ')
      : initialProfile?.techStack || ''
  );
  const [experience, setExperience] = useState(initialProfile?.experience || '');
  const [about, setAbout] = useState(initialProfile?.about || '');
  const [portfolio, setPortfolio] = useState(initialProfile?.portfolio || '');
  const [contact, setContact] = useState(initialProfile?.contact || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!role.trim()) {
      setError('Preferred role is required (e.g. Frontend Dev, ML Engineer).');
      return;
    }
    if (!skills.trim()) {
      setError('Please list at least one skill.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await createProfileCard({
        role: role.trim(),
        hackathon: hackathon.trim() || undefined,
        skills: skills.trim(),
        tech_stack: techStack.trim() || undefined,
        experience: experience.trim() || undefined,
        about: about.trim() || undefined,
        portfolio: portfolio.trim() || undefined,
        contact: contact.trim() || undefined,
        status: 'open_to_join',
      });

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
      setError(err.message || 'Failed to publish profile card.');
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
                label="Contact Info"
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
});
