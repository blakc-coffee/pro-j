import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { colors } from '../constants/colors';
import { radius, spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { useAuth } from '../context/AuthContext';
import { listNotifications } from '../services/notifications';

export default function AppNavBar() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await listNotifications();
      if (res && typeof res.unread_count === 'number') {
        setUnreadCount(res.unread_count);
      }
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount])
  );

  useEffect(() => {
    const timer = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(timer);
  }, [fetchUnreadCount]);

  const initials = (() => {
    const name = (user?.name || user?.roll_no || '').trim();
    if (!name) return 'U';
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  })();

  return (
    <View style={styles.navBar}>
      <View style={styles.left}>
        <Text style={styles.brandTitle}>Plattayam</Text>
      </View>

      <View style={styles.right}>
        {/* Notification Bell */}
        <Pressable
          style={styles.iconButton}
          onPress={() => navigation.navigate('Notifications')}
          accessibilityRole="button"
          accessibilityLabel={`Notifications, ${unreadCount} unread`}
          hitSlop={8}
        >
          <Text style={styles.bellIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : String(unreadCount)}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Profile Avatar Button */}
        <Pressable
          style={styles.avatarButton}
          onPress={() => navigation.navigate('Profile')}
          accessibilityRole="button"
          accessibilityLabel="User profile"
          hitSlop={8}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 48,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    ...typography.heading,
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconButton: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: '#f7f5f2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bellIcon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: colors.destructive || '#dc2626',
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
