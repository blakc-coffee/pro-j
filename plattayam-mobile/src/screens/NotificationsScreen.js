import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import AppHeader from '../components/AppHeader';
import AppShell from '../components/AppShell';
import Card from '../components/Card';
import ScreenState from '../components/ScreenState';
import { colors } from '../constants/colors';
import { radius, spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../services/notifications';

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getNotificationIcon(type) {
  if (!type) return '🔔';
  if (type.startsWith('cab_')) return '🚗';
  if (type.startsWith('hack_')) return '💻';
  if (type.startsWith('lost_')) return '🔍';
  return '🔔';
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError('');
    try {
      const res = await listNotifications();
      setNotifications(res?.notifications || []);
    } catch (err) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleNotificationPress = async (item) => {
    if (!item.is_read) {
      markNotificationAsRead(item.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
    }

    if (!item.reference_id) return;
    const refId = parseInt(item.reference_id, 10);
    if (isNaN(refId)) return;

    if (item.type.startsWith('cab_')) {
      navigation.navigate('RideDetails', { cabId: refId });
    } else if (item.type.startsWith('hack_')) {
      navigation.navigate('TeamDetails', { teamId: refId });
    } else if (item.type === 'lost_message') {
      navigation.navigate('ItemDetails', { itemId: refId });
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AppShell>
      <View style={styles.screen}>
        <AppHeader
          title="Notifications"
          onBack={() => navigation.goBack()}
          actionLabel={unreadCount > 0 ? 'Mark all read' : undefined}
          onAction={unreadCount > 0 ? handleMarkAllRead : undefined}
        />

        <ScreenState
          loading={loading && !refreshing}
          error={error}
          empty={!loading && !error && notifications.length === 0}
          emptyMessage="No notifications yet. You're all caught up!"
        >
          <FlatList
            data={notifications}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
            }
            renderItem={({ item }) => {
              const isUnread = !item.is_read;
              return (
                <Pressable
                  onPress={() => handleNotificationPress(item)}
                  accessibilityRole="button"
                >
                  <Card
                    padding="md"
                    style={[styles.notifCard, isUnread && styles.unreadCard]}
                  >
                    <View style={styles.cardRow}>
                      <View style={styles.iconBox}>
                        <Text style={styles.iconText}>{getNotificationIcon(item.type)}</Text>
                      </View>
                      <View style={styles.contentBox}>
                        <View style={styles.titleRow}>
                          <Text style={[styles.title, isUnread && styles.unreadTitle]}>
                            {item.title}
                          </Text>
                          <Text style={styles.timeText}>
                            {formatRelativeTime(item.created_at)}
                          </Text>
                        </View>
                        <Text style={styles.messageText}>{item.message}</Text>
                      </View>
                      {isUnread && <View style={styles.unreadDot} />}
                    </View>
                  </Card>
                </Pressable>
              );
            }}
          />
        </ScreenState>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  notifCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unreadCard: {
    backgroundColor: '#ffffff',
    borderColor: colors.primary,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: '#f7f5f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  contentBox: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    ...typography.body,
    fontWeight: '500',
    color: colors.foreground,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  timeText: {
    ...typography.caption,
    color: colors.mutedForeground,
    fontSize: 11,
  },
  messageText: {
    ...typography.caption,
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
});
