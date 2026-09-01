import { Pressable, StyleSheet, Text, View } from 'react-native';

import Avatar from '../../../components/Avatar';
import Card from '../../../components/Card';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import { formatFullName } from '../../../utils/format';

export default function PeopleCard({ person, onPress }) {
  if (!person) return null;

  const isOpen = person.status === 'open_to_join';
  const displayName = formatFullName(person.name) || person.name || 'Candidate';
  const rollText = person.roll_no || person.rollNo || '';

  const skillsText = Array.isArray(person.skills)
    ? person.skills.join(' · ')
    : person.skills || '';

  const techText = Array.isArray(person.techStack)
    ? person.techStack.join(' · ')
    : person.techStack || '';

  return (
    <Card padding="lg" style={styles.card}>
      {/* Top Row: Avatar + Name + Status */}
      <View style={styles.topRow}>
        <Avatar name={person.name} size={42} style={styles.avatar} />
        <View style={styles.nameContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {rollText ? <Text style={styles.rollNo}>{rollText}</Text> : null}
        </View>

        <Text style={[styles.statusText, isOpen ? styles.statusOpen : styles.statusFound]}>
          {isOpen ? 'OPEN TO JOIN' : 'TEAM FOUND'}
        </Text>
      </View>

      {/* Role & Hackathon Kicker */}
      <View style={styles.metaHeader}>
        <Text style={styles.roleText}>{person.role}</Text>
        {person.hackathon ? (
          <Text style={styles.hackathonTag}>{person.hackathon.toUpperCase()}</Text>
        ) : null}
      </View>

      {/* Skills */}
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

      {/* Bottom Row */}
      <View style={styles.bottomRow}>
        <Text style={styles.expText}>
          {person.experience ? '2+ yrs exp' : 'Open to collaborate'}
        </Text>

        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.viewBtn, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel={`View profile of ${person.name}`}
        >
          <Text style={styles.viewBtnText}>View Profile</Text>
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
    marginBottom: 8,
  },
  avatar: {
    marginRight: 10,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    ...typography.heading,
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
  },
  rollNo: {
    ...typography.caption,
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 1,
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
  metaHeader: {
    marginBottom: 6,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  hackathonTag: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent, // #cd2f7b
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
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
  expText: {
    ...typography.caption,
    color: colors.mutedForeground,
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
