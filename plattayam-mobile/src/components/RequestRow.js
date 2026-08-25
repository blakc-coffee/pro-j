import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/colors';
import { radius, spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { formatFullName, getFirstName, requestStatusKey, requestStatusLabel } from '../utils/format';
import StatusBadge from './StatusBadge';

export default function RequestRow({
  request,
  profile,
  showActions,
  busy,
  onAccept,
  onReject,
  onPressUser,
}) {
  if (!request) {
    return null;
  }

  return (
    <View style={styles.row}>
      <Pressable style={styles.info} onPress={onPressUser}>
        <Text style={styles.name}>{profile?.name ? getFirstName(formatFullName(profile.name)) : `User #${request.req_user_id}`}</Text>
        <StatusBadge
          status={requestStatusKey(request.status)}
          label={requestStatusLabel(request.status)}
        />
      </Pressable>

      <View style={styles.right}>

        {showActions ? (
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
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.heading,
    color: colors.foreground,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  reject: {
    backgroundColor: colors.destructiveSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  rejectText: {
    color: colors.destructive,
    fontWeight: '700',
  },
  accept: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  acceptText: {
    color: colors.successForeground,
    fontWeight: '700',
  },
});
