import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import Avatar from '../../../components/Avatar';
import Card from '../../../components/Card';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import { formatFullName } from '../../../utils/format';

export default function TeamRequestCard({
  request,
  onAccept,
  onReject,
  busy,
}) {
  if (!request) return null;

  const isPending = request.status === 'pending';
  const displayName = formatFullName(request.name) || request.name || 'Applicant';

  const skillsText = Array.isArray(request.skills)
    ? request.skills.join(' · ')
    : request.skills || '';

  return (
    <Card padding="lg" style={styles.card}>
      {/* Top Row: Avatar + Name/Roll */}
      <View style={styles.userRow}>
        <Avatar name={request.name} size={44} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.name}>{displayName}</Text>
          {request.rollNo ? <Text style={styles.rollNo}>{request.rollNo}</Text> : null}
        </View>

        {!isPending ? (
          <Text
            style={[
              styles.statusText,
              request.status === 'accepted'
                ? styles.statusAccepted
                : styles.statusRejected,
            ]}
          >
            {request.status.toUpperCase()}
          </Text>
        ) : null}
      </View>

      {/* Role */}
      {request.role ? (
        <Text style={styles.role}>{request.role}</Text>
      ) : null}

      {/* Skills */}
      {skillsText ? (
        <Text style={styles.skills}>{skillsText}</Text>
      ) : null}

      {/* Notes if any */}
      {request.notes ? (
        <Text style={styles.notes}>{request.notes}</Text>
      ) : null}

      {/* Action Buttons (Accept / Reject) */}
      {isPending ? (
        <View style={styles.actionsRow}>
          {busy ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <>
              <Pressable
                onPress={onAccept}
                style={({ pressed }) => [styles.btn, styles.acceptBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Accept request from ${request.name}`}
              >
                <Text style={styles.acceptBtnText}>Accept</Text>
              </Pressable>

              <Pressable
                onPress={onReject}
                style={({ pressed }) => [styles.btn, styles.rejectBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Reject request from ${request.name}`}
              >
                <Text style={styles.rejectBtnText}>Reject</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  avatar: {
    marginRight: spacing.sm,
  },
  userInfo: {
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
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statusAccepted: {
    color: colors.success, // #107c41
  },
  statusRejected: {
    color: colors.destructive, // #d9381e
  },
  role: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 6,
  },
  skills: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 2,
    marginBottom: 12,
  },
  notes: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.foreground,
    backgroundColor: colors.surfaceAlt,
    padding: 8,
    borderRadius: radius.sm,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  acceptBtn: {
    backgroundColor: colors.primary, // #0061fe solid
  },
  acceptBtnText: {
    color: colors.primaryForeground,
    fontWeight: '700',
    fontSize: 14,
  },
  rejectBtn: {
    backgroundColor: colors.destructive, // #d9381e solid matching reference screenshot
  },
  rejectBtnText: {
    color: colors.destructiveForeground,
    fontWeight: '700',
    fontSize: 14,
  },
  btnPressed: {
    opacity: 0.88,
  },
  loader: {
    flex: 1,
    paddingVertical: 12,
  },
});
