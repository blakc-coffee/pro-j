import { Pressable, StyleSheet, Text, View } from 'react-native';

import Avatar from '../../../components/Avatar';
import StatusBadge from '../../../components/StatusBadge';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import {
  formatFullName,
  requestStatusKey,
  requestStatusLabel,
} from '../../../utils/format';

export default function RequestRow({
  request,
  onPressUser,
  canRespond,
  onAccept,
  onReject,
  loadingAction,
}) {
  const isPending = requestStatusKey(request.status) === 'pending';
  const seats = Number(request.seats_requested ?? 1);
  const rawName = request.user_name || request.name || request.roll_no || 'Rider';
  const requesterName = formatFullName(rawName) || rawName;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPressUser}
        style={styles.userSection}
        accessibilityRole="button"
        accessibilityLabel={`View profile of ${requesterName}`}
      >
        <Avatar name={requesterName} size={36} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.name}>{requesterName}</Text>
          <Text style={styles.meta}>
            {seats} seat{seats === 1 ? '' : 's'} requested
          </Text>
        </View>
      </Pressable>

      {canRespond && isPending ? (
        <View style={styles.actions}>
          <Pressable
            onPress={onReject}
            disabled={loadingAction}
            style={[styles.actionButton, styles.rejectButton]}
            accessibilityRole="button"
            accessibilityLabel={`Reject request from ${requesterName}`}
          >
            <Text style={[styles.actionText, styles.rejectText]}>Reject</Text>
          </Pressable>
          <Pressable
            onPress={onAccept}
            disabled={loadingAction}
            style={[styles.actionButton, styles.acceptButton]}
            accessibilityRole="button"
            accessibilityLabel={`Accept request from ${requesterName}`}
          >
            <Text style={[styles.actionText, styles.acceptText]}>Accept</Text>
          </Pressable>
        </View>
      ) : (
        <StatusBadge
          status={request.status}
          label={requestStatusLabel(request.status)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    ...typography.subheading,
    color: colors.foreground,
  },
  meta: {
    ...typography.caption,
    color: colors.mutedForeground,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  acceptText: {
    color: colors.white,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
  rejectText: {
    color: colors.foreground,
  },
  actionText: {
    ...typography.label,
  },
});
