import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Avatar from '../../../components/Avatar';
import PrimaryButton from '../../../components/PrimaryButton';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import { getUserProfile } from '../services/rides';
import { formatFullName } from '../../../utils/format';

export default function UserProfileModal({ userId, visible, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible || !userId) {
      setProfile(null);
      setError('');
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError('');

    getUserProfile(userId)
      .then((data) => {
        if (isMounted) {
          setProfile(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Could not load profile.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [visible, userId]);

  if (!visible) return null;

  const rawName = profile?.name || profile?.roll_no || 'Campus User';
  const displayName = formatFullName(rawName) || rawName;
  const rollNo = profile?.roll_no;
  const email = profile?.email_id || (rollNo ? `${rollNo}@iiitkottayam.ac.in` : null);
  const phone = profile?.phone_no;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Campus Profile</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close profile dialog"
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.loadingText}>Fetching profile...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : profile ? (
            <View style={styles.content}>
              <View style={styles.avatarRow}>
                <Avatar name={displayName} size={56} style={styles.avatar} />
                <View style={styles.nameSection}>
                  <Text style={styles.fullName}>{displayName}</Text>
                  {rollNo ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{rollNo}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone / Contact</Text>
                <Text style={styles.infoValue}>{phone || 'Not available'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{email || 'Not available'}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.footer}>
            <PrimaryButton label="Close" tone="secondary" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.subheading,
    color: colors.foreground,
  },
  closeText: {
    ...typography.subheading,
    color: colors.mutedForeground,
    paddingHorizontal: spacing.xs,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
    color: colors.mutedForeground,
  },
  errorContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.destructive,
    textAlign: 'center',
  },
  content: {
    marginBottom: spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    backgroundColor: colors.surfaceAlt,
  },
  nameSection: {
    flex: 1,
    gap: spacing.xs,
  },
  fullName: {
    ...typography.heading,
    color: colors.foreground,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.foreground,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  infoRow: {
    marginBottom: spacing.sm,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginBottom: 2,
  },
  infoValue: {
    ...typography.body,
    color: colors.foreground,
  },
  footer: {
    marginTop: spacing.xs,
  },
});
