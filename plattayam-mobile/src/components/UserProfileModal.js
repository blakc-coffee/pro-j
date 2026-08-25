import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/colors';
import { radius, spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { formatFullName, requestStatusKey, requestStatusLabel } from '../utils/format';
import StatusBadge from './StatusBadge';

export default function UserProfileModal({
  visible,
  userId,
  request,
  profile,
  loading,
  onClose,
  onAccept,
  onReject,
  busy,
}) {
  const effectiveUserId = request?.req_user_id || userId;
  if (!effectiveUserId && !visible) return null;

  const status = request ? requestStatusKey(request.status) : null;
  const showActions = status === 'pending';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>User Profile</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>X</Text>
            </Pressable>
          </View>

          <View style={styles.userRow}>
            <Text style={styles.name}>{profile?.name ? formatFullName(profile.name) : `User #${effectiveUserId}`}</Text>
            {request && (
              <StatusBadge
                status={status}
                label={requestStatusLabel(request.status)}
              />
            )}
          </View>

          <View style={styles.content}>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : profile ? (
              <View style={styles.details}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name</Text>
                  <Text style={styles.detailValue}>{formatFullName(profile.name) || 'Not provided'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Roll No.</Text>
                  <Text style={styles.detailValue}>{profile.roll_no || 'Not provided'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gender</Text>
                  <Text style={styles.detailValue}>{profile.gender || 'Not provided'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{profile.phone_no || 'Not provided'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{profile.email_id || 'Not provided'}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.emptyMsg}>
                Additional details not provided by the backend.
              </Text>
            )}
          </View>

          {showActions && (
            <View style={styles.actions}>
              {busy ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Pressable style={styles.reject} onPress={onReject}>
                    <Text style={styles.rejectText}>Reject</Text>
                  </Pressable>
                  <Pressable style={styles.accept} onPress={onAccept}>
                    <Text style={styles.acceptText}>Accept</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modal: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.title,
    color: colors.foreground,
  },
  closeBtn: {
    padding: spacing.sm,
  },
  closeText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  name: {
    ...typography.heading,
    fontSize: 20,
    color: colors.foreground,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  emptyMsg: {
    ...typography.body,
    color: colors.mutedForeground,
    fontStyle: 'italic',
  },
  details: {
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    ...typography.body,
    color: colors.mutedForeground,
    width: 80,
  },
  detailValue: {
    ...typography.body,
    color: colors.foreground,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  reject: {
    backgroundColor: colors.destructiveSoft,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  rejectText: {
    color: colors.destructive,
    fontWeight: '700',
  },
  accept: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  acceptText: {
    color: colors.successForeground,
    fontWeight: '700',
  },
});
