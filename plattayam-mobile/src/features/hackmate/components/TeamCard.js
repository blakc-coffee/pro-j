import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import Card from '../../../components/Card';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';

const hackmateIcon = require('../../../../assets/icon-hackmate.png');
const laptopIcon = require('../../../../assets/icon-laptop.png');

export default function TeamCard({ team, onPress }) {
  if (!team) return null;

  const memberCount = Array.isArray(team.members) ? team.members.length : 1;
  const maxMembers = team.maxMembers || 4;
  const isVacant = team.status === 'looking_for_members' || memberCount < maxMembers;

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
        <Text style={[styles.statusText, isVacant ? styles.statusLooking : styles.statusFull]}>
          {isVacant ? 'Vacant' : 'Full'}
        </Text>
      </View>

      {/* Hackathon Tag */}
      <View style={styles.hackathonRow}>
        <Image source={laptopIcon} style={styles.laptopIcon} resizeMode="contain" />
        <Text style={styles.hackathonTag}>{team.hackathon}</Text>
      </View>

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
        <View style={styles.memberCountRow}>
          <Image source={hackmateIcon} style={styles.memberIcon} resizeMode="contain" />
          <Text style={styles.memberCount}>
            {memberCount} / {maxMembers} members
          </Text>
        </View>

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
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  statusLooking: {
    color: colors.success,
  },
  statusFull: {
    color: colors.mutedForeground,
  },
  hackathonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  laptopIcon: {
    width: 14,
    height: 14,
    tintColor: colors.accent,
  },
  hackathonTag: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent, // #cd2f7b
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  memberCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberIcon: {
    width: 16,
    height: 16,
    tintColor: colors.mutedForeground,
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
