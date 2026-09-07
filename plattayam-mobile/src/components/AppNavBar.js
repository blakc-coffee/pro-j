import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { colors } from '../constants/colors';
import { radius, spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const bellIconSource = require('../../assets/bell-icon.png');

export default function AppNavBar() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  // Pulse animation when unreadCount increases
  const badgeScale = useRef(new Animated.Value(1)).current;
  const prevCountRef = useRef(unreadCount);

  useEffect(() => {
    if (unreadCount > prevCountRef.current && unreadCount > 0) {
      Animated.sequence([
        Animated.timing(badgeScale, {
          toValue: 1.3,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.spring(badgeScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount, badgeScale]);

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
          <View style={styles.bellWrapper}>
            <Image
              source={bellIconSource}
              style={styles.bellGraphic}
              resizeMode="contain"
            />
            {unreadCount > 0 && (
              <Animated.View
                style={[
                  styles.badge,
                  unreadCount > 9 && styles.badgeWide,
                  { transform: [{ scale: badgeScale }] },
                ]}
              >
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : String(unreadCount)}
                </Text>
              </Animated.View>
            )}
          </View>
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
    backgroundColor: 'transparent',
    borderWidth: 0,
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
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  bellWrapper: {
    position: 'relative',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellGraphic: {
    width: 24,
    height: 24,
    tintColor: '#334155',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -7,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#ec003f',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#ec003f',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeWide: {
    width: 'auto',
    minWidth: 17,
    paddingHorizontal: 4,
    borderRadius: 8.5,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
    textAlign: 'center',
    includeFontPadding: false,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
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
