import { useCallback } from 'react';
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
import { useNotifications } from '../context/NotificationContext';
import { formatRelativeTime } from '../utils/format';

export default function NotificationsScreen() {
  const navigation = useNavigation();

  const {
    notifications,
    unreadCount,
    loading,
    refreshing,
    error,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      fetchNotifications(true);
    }, [fetchNotifications])
  );

  const handleNotificationPress = async (item) => {
    if (!item.is_read) {
      markAsRead(item.id);
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

  return (
    <AppShell>
      <View style={styles.screen}>
        <AppHeader
          title="Notifications"
          onBack={() => navigation.goBack()}
          actionLabel={unreadCount > 0 ? 'Mark all read' : undefined}
          onAction={unreadCount > 0 ? markAllAsRead : undefined}
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
              <RefreshControl refreshing={refreshing} onRefresh={() => fetchNotifications(true)} />
            }
            renderItem={({ item }) => {
              const isUnread = !item.is_read;
              return (
                <Pressable
                  onPress={() => handleNotificationPress(item)}
                  accessibilityRole="button"
                >
                  <Card
                    padding="none"
                    style={[styles.notifCard, !isUnread && styles.readCard]}
                  >
                    <View style={styles.contentBox}>
                      <View style={styles.titleRow}>
                        <Text
                          style={[styles.title, isUnread ? styles.unreadTitle : styles.readTitle]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text style={[styles.timeText, isUnread && styles.unreadTime]}>
                          {formatRelativeTime(item.created_at)}
                        </Text>
                      </View>
                      <Text
                        style={[styles.messageText, isUnread ? styles.unreadMessage : styles.readMessage]}
                      >
                        {item.message}
                      </Text>
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
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  readCard: {
    opacity: 0.78,
  },
  contentBox: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    ...typography.body,
    fontSize: 14,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
    color: colors.foreground,
  },
  readTitle: {
    fontWeight: '400',
    color: colors.mutedForeground,
  },
  timeText: {
    ...typography.caption,
    fontSize: 11,
    marginLeft: spacing.sm,
    color: colors.mutedForeground,
  },
  unreadTime: {
    fontWeight: '600',
  },
  messageText: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
  },
  unreadMessage: {
    color: colors.foreground,
    fontWeight: '400',
  },
  readMessage: {
    color: colors.mutedForeground,
  },
});
