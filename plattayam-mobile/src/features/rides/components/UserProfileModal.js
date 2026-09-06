import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        {/* Scrim backdrop dismiss */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss modal backdrop"
        />

        {/* Elevated Foreground Dialog Card */}
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.kicker}>CAMPUS PROFILE</Text>
              <Text style={styles.title}>User Details</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close profile dialog"
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
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

                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>PHONE / CONTACT</Text>
                  <Text style={styles.infoValue}>{phone || 'Not available'}</Text>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>EMAIL ADDRESS</Text>
                  <Text style={styles.infoValue}>{email || 'Not available'}</Text>
                </View>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <PrimaryButton label="Close" tone="secondary" onPress={onClose} />
          </View>
        </View>
      </View>
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
    maxWidth: 380,
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
      },
      android: {
        elevation: 16,
      },
      web: {
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  kicker: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  title: {
    ...typography.subheading,
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  closeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  scrollContent: {
    paddingVertical: spacing.xs,
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
    marginBottom: spacing.sm,
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
    fontSize: 17,
    fontWeight: '700',
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
  infoCard: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedForeground,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  footer: {
    marginTop: spacing.md,
  },
});
