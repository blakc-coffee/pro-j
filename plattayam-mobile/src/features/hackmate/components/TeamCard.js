import { Pressable, StyleSheet, Text, View } from 'react-native';

import Card from '../../../components/Card';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';

export default function TeamCard({ team, onPress }) {
  if (!team) return null;

  const isLooking = team.status === 'looking_for_members';
  const memberCount = Array.isArray(team.members) ? team.members.length : 1;
  const maxMembers = team.maxMembers || 4;

  const skillsText = Array.isArray(team.skills)
    ? team.skills.join(' · ')
    : team.skills || '';

  const techText = Array.isArray(team.techStack)
    ? team.techStack.join(' · ')
    : team.techStack || '';

  return (
    <Card padding="lg" style={styles.card}>
      {/* Header Row */}
      <View style={styles.topRow}>
        <Text style={styles.teamName} numberOfLines={1}>
          {team.name}
        </Text>
        <Text style={[styles.statusText, isLooking ? styles.statusLooking : styles.statusFull]}>
          {isLooking ? 'LOOKING FOR MEMBERS' : 'FULL'}
        </Text>
      </View>

      {/* Hackathon Tag */}
      <Text style={styles.hackathonTag}>{team.hackathon}</Text>

      {/* Description */}
      {team.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {team.description}
        </Text>
      ) : null}

      {/* Skills Required */}
      {skillsText ? (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Skills: </Text>
          <Text style={styles.metaValue} numberOfLines={1}>
            {skillsText}
          </Text>
        </View>
      ) : null}

      {/* Tech Stack */}
      {techText ? (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Tech: </Text>
          <Text style={styles.metaValue} numberOfLines={1}>
            {techText}
          </Text>
        </View>
      ) : null}

      {/* Footer Row */}
      <View style={styles.bottomRow}>
        <Text style={styles.memberCount}>
          {memberCount} / {maxMembers} members
        </Text>

        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.viewBtn, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel={`View team ${team.name}`}
        >
          <Text style={styles.viewBtnText}>View Team</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statusLooking: {
    color: colors.success, // #107c41
  },
  statusFull: {
    color: colors.mutedForeground, // #716b61
  },
  hackathonTag: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent, // #cd2f7b
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  description: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.foreground,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  metaLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.foreground,
  },
  metaValue: {
    ...typography.caption,
    color: colors.mutedForeground,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  memberCount: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
  },
  viewBtn: {
    backgroundColor: colors.primary, // #0061fe
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.88,
  },
  viewBtnText: {
    color: colors.primaryForeground,
    fontSize: 13,
    fontWeight: '600',
  },
});
