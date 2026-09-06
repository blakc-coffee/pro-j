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
import { useNavigation } from '@react-navigation/native';

import AppHeader from '../../../components/AppHeader';
import AppShell from '../../../components/AppShell';
import Card from '../../../components/Card';
import FormInput from '../../../components/FormInput';
import PrimaryButton from '../../../components/PrimaryButton';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import { createTeam } from '../services/hackfind';

export default function CreateTeamScreen() {
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [hackathon, setHackathon] = useState('');
  const [description, setDescription] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [skills, setSkills] = useState('');
  const [techStack, setTechStack] = useState('');
  const [maxMembers, setMaxMembers] = useState('4');
  const [contact, setContact] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (loading) return;
    if (!name.trim()) {
      setError('Team name is required.');
      return;
    }
    if (!hackathon.trim()) {
      setError('Hackathon name is required.');
      return;
    }

    const parsedMax = parseInt(maxMembers, 10);
    if (isNaN(parsedMax) || parsedMax < 2 || parsedMax > 10) {
      setError('Team size must be a number between 2 and 10.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await createTeam({
        name: name.trim(),
        hackathon: hackathon.trim(),
        description: description.trim() || undefined,
        problem_statement: problemStatement.trim() || undefined,
        skills: skills.trim() || undefined,
        tech_stack: techStack.trim() || undefined,
        max_members: parsedMax,
        contact: contact.trim() || undefined,
      });

      if (Platform.OS === 'web') {
        window.alert(`Your team "${name.trim()}" is now published on the HackMate marketplace!`);
        navigation.goBack();
      } else {
        Alert.alert(
          'Team Created',
          `Your team "${name.trim()}" is now published on the HackMate marketplace!`,
          [
            {
              text: 'View Marketplace',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (err) {
      setError(err.message || 'Failed to create team.');
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <View style={styles.screen}>
        <AppHeader title="Create a Team" onBack={() => navigation.goBack()} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.content}>
            <Card padding="lg" style={styles.card}>
              <Text style={styles.sectionHeader}>TEAM & EVENT DETAILS</Text>

              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <FormInput
                label="Team Name *"
                placeholder="e.g. AlgoRhythm, Web3 Mavericks"
                value={name}
                onChangeText={setName}
              />

              <FormInput
                label="Target Hackathon *"
                placeholder="e.g. Smart India Hackathon 2026, HackNITR"
                value={hackathon}
                onChangeText={setHackathon}
              />

              <FormInput
                label="Max Team Size (2-10)"
                placeholder="4"
                value={maxMembers}
                onChangeText={setMaxMembers}
                keyboardType="numeric"
              />

              <FormInput
                label="Project Description"
                placeholder="What is your team building or planning to build?"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              <FormInput
                label="Problem Statement / Theme"
                placeholder="e.g. AI-driven traffic monitoring, AgriTech IoT"
                value={problemStatement}
                onChangeText={setProblemStatement}
              />

              <Text style={styles.sectionHeader}>REQUIREMENTS & CONTACT</Text>

              <FormInput
                label="Skills Needed (comma-separated)"
                placeholder="e.g. Frontend Dev, ML Engineer, UI/UX"
                value={skills}
                onChangeText={setSkills}
              />

              <FormInput
                label="Tech Stack (comma-separated)"
                placeholder="e.g. React Native, FastAPI, PostgreSQL"
                value={techStack}
                onChangeText={setTechStack}
              />

              <FormInput
                label="Leader Contact / Phone"
                placeholder="e.g. 9876543210 or @telegram_handle"
                value={contact}
                onChangeText={setContact}
              />

              <View style={styles.btnRow}>
                <PrimaryButton
                  label="Create Team"
                  tone="primary"
                  loading={loading}
                  loadingLabel="Creating..."
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
