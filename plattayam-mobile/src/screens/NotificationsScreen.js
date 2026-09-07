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

import { Image } from 'react-native';

const cabIcon = require('../../assets/icon-cab.png');
const lostFoundIcon = require('../../assets/icon-lostfound.png');
const hackmateIcon = require('../../assets/icon-hackmate.png');
const laptopIcon = require('../../assets/icon-laptop.png');
const bellIcon = require('../../assets/bell-icon.png');

function renderNotificationIcon(type) {
  if (type?.startsWith('cab_')) {
    return <Image source={cabIcon} style={styles.notifIconImage} resizeMode="contain" />;
  }
  if (type?.startsWith('hack_')) {
    return <Image source={type === 'hack_invite' ? hackmateIcon : laptopIcon} style={styles.notifIconImage} resizeMode="contain" />;
  }
  if (type?.startsWith('lost_')) {
    return <Image source={lostFoundIcon} style={styles.notifIconImage} resizeMode="contain" />;
  }
  return <Image source={bellIcon} style={styles.notifIconImage} resizeMode="contain" />;
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const {
    notifications,
    unreadCount,
    loading,
    refreshing,
    error,
    refresh,
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
                        {renderNotificationIcon(item.type)}
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
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIconImage: {
    width: 20,
    height: 20,
    tintColor: colors.primary,
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
