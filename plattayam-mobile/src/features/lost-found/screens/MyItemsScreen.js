import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import AppHeader from '../../../components/AppHeader';
import AppShell from '../../../components/AppShell';
import Card from '../../../components/Card';
import PrimaryButton from '../../../components/PrimaryButton';
import ScreenState from '../../../components/ScreenState';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import { deleteItem, listMyItems, updateItemStatus } from '../services/lostfound';

const TABS = ['Active', 'History'];

function isItemExpired(item) {
  if (!item.created_at && !item.createdAt) return false;
  try {
    const created = new Date(item.created_at || item.createdAt);
    const now = new Date();
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    return diffDays >= 30;
  } catch {
    return false;
  }
}

function formatPostedDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffHours = Math.floor((now - d) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  } catch {
    return '';
  }
}

export default function MyItemsScreen() {
  const navigation = useNavigation();

  const [selectedTab, setSelectedTab] = useState('Active');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionBusyId, setActionBusyId] = useState(null);

  const loadData = useCallback(async () => {
    setError('');
    try {
      const res = await listMyItems();
      setItems(Array.isArray(res) ? res : []);
    } catch (err) {
      setError(err.message || 'Failed to load your items.');
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

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Status Change with Confirmation
  const handleStatusChange = (item, newStatus) => {
    const actionName = newStatus === 'claimed' ? 'Claimed' : newStatus === 'resolved' ? 'Resolved' : 'Open';
    Alert.alert(
      `Mark as ${actionName}?`,
      newStatus === 'open'
        ? 'This will reopen the listing and make it visible in the active marketplace.'
        : `This will mark the item as ${newStatus} and move it to your History.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Mark ${actionName}`,
          onPress: async () => {
            setActionBusyId(item.id);
            try {
              const updated = await updateItemStatus(item.id, newStatus);
              setItems((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, ...updated } : i))
              );
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to update status.');
            } finally {
              setActionBusyId(null);
            }
          },
        },
      ]
    );
  };

  // Delete with Confirmation
  const handleDelete = (item) => {
    Alert.alert(
      'Delete Listing?',
      'This cannot be undone. Are you sure you want to delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionBusyId(item.id);
            try {
              await deleteItem(item.id);
              setItems((prev) => prev.filter((i) => i.id !== item.id));
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete listing.');
            } finally {
              setActionBusyId(null);
            }
          },
        },
      ]
    );
  };

  // Group items into Active vs History
  const activeItems = items.filter(
    (item) => item.status === 'open' && !isItemExpired(item)
  );

  const historyItems = items.filter(
    (item) => item.status !== 'open' || isItemExpired(item)
  );

  const displayedItems = selectedTab === 'Active' ? activeItems : historyItems;
  const isEmpty = !loading && !error && displayedItems.length === 0;

  return (
    <AppShell>
      <View style={styles.screen}>
        <AppHeader
          title="My Items"
          subtitle="Manage your lost & found reports"
          onBack={() => navigation.goBack()}
        />

        {/* Tab Segmented Control: Active | History */}
        <View style={styles.tabContainer}>
          <View style={styles.segmentWrap}>
            {TABS.map((tab) => {
              const active = selectedTab === tab;
              const count = tab === 'Active' ? activeItems.length : historyItems.length;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setSelectedTab(tab)}
                  style={[styles.segment, active && styles.segmentActive]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {tab} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* List Content */}
        <ScreenState
          loading={loading && !refreshing}
          error={error}
          onRetry={loadData}
          empty={isEmpty}
          emptyMessage={
            selectedTab === 'Active'
              ? 'You have no active lost or found reports.'
              : 'No resolved or archived reports yet.'
          }
        >
          <FlatList
            data={displayedItems}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => {
              const isLost = item.type === 'lost';
              const hasImage = !!(item.image_url || item.imageUrl);
              const imageUrl = item.image_url || item.imageUrl;
              const expired = isItemExpired(item) && item.status === 'open';
              const displayStatus = expired ? 'EXPIRED' : (item.status || 'open').toUpperCase();
              const isBusy = actionBusyId === item.id;

              return (
                <Card style={styles.itemCard}>
                  {/* Image / Placeholder Header */}
                  <Pressable
                    onPress={() => navigation.navigate('ItemDetails', { itemId: item.id })}
                    style={styles.cardHeaderPressable}
                    accessibilityRole="button"
                  >
                    {hasImage ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderIcon}>
                          {isLost ? '🔍' : '📦'}
                        </Text>
                        <Text style={styles.placeholderCategory}>
                          {item.category || 'CAMPUS ITEM'}
                        </Text>
                      </View>
                    )}

                    {/* Card Body */}
                    <View style={styles.cardBody}>
                      {/* Top Row: Type + Status + Date (Plain Text Design Rule) */}
                      <View style={styles.badgeRow}>
                        <View style={styles.badgeGroup}>
                          <Text
                            style={[
                              styles.typeText,
                              isLost ? styles.typeTextLost : styles.typeTextFound,
                            ]}
                          >
                            {isLost ? 'LOST' : 'FOUND'}
                          </Text>

                          <Text
                            style={[
                              styles.statusText,
                              item.status === 'claimed'
                                ? styles.statusTextClaimed
                                : item.status === 'resolved'
                                ? styles.statusTextResolved
                                : expired
                                ? styles.statusTextExpired
                                : styles.statusTextOpen,
                            ]}
                          >
                            {displayStatus}
                          </Text>
                        </View>

                        <Text style={styles.postedDateText}>
                          {formatPostedDate(item.created_at || item.createdAt)}
                        </Text>
                      </View>

                      {/* Title */}
                      <Text style={styles.itemTitle} numberOfLines={2}>
                        {item.title}
                      </Text>

                      {/* Location */}
                      {item.location ? (
                        <Text style={styles.locationText} numberOfLines={1}>
                          📍 {item.location}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>

                  {/* Actions Bar */}
                  <View style={styles.actionsBar}>
                    {/* Edit Button */}
                    <Pressable
                      onPress={() => navigation.navigate('ReportItem', { itemId: item.id })}
                      disabled={isBusy}
                      style={[styles.actionBtn, styles.editBtn]}
                      accessibilityRole="button"
                    >
                      <Text style={styles.editBtnText}>Edit</Text>
                    </Pressable>

                    {/* Status Options */}
                    {item.status === 'open' && !expired ? (
                      <>
                        <Pressable
                          onPress={() => handleStatusChange(item, 'claimed')}
                          disabled={isBusy}
                          style={[styles.actionBtn, styles.claimBtn]}
                          accessibilityRole="button"
                        >
                          <Text style={styles.claimBtnText}>Claimed</Text>
                        </Pressable>

                        <Pressable
                          onPress={() => handleStatusChange(item, 'resolved')}
                          disabled={isBusy}
                          style={[styles.actionBtn, styles.resolveBtn]}
                          accessibilityRole="button"
                        >
                          <Text style={styles.resolveBtnText}>Resolved</Text>
                        </Pressable>
                      </>
                    ) : (
                      <Pressable
                        onPress={() => handleStatusChange(item, 'open')}
                        disabled={isBusy}
                        style={[styles.actionBtn, styles.reopenBtn]}
                        accessibilityRole="button"
                      >
                        <Text style={styles.reopenBtnText}>Reopen</Text>
                      </Pressable>
                    )}

                    {/* Delete Button */}
                    <Pressable
                      onPress={() => handleDelete(item)}
                      disabled={isBusy}
                      style={[styles.actionBtn, styles.deleteBtn]}
                      accessibilityRole="button"
                    >
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </Pressable>
                  </View>
                </Card>
              );
            }}
          />
        </ScreenState>

        {/* Empty Active State CTA */}
        {selectedTab === 'Active' && isEmpty ? (
          <View style={styles.emptyCtaWrap}>
            <PrimaryButton
              label="Report an Item"
              tone="primary"
              onPress={() => navigation.navigate('ReportItem')}
            />
          </View>
        ) : null}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: '#e8e3dc',
    borderRadius: radius.md,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  segmentActive: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  segmentTextActive: {
    color: colors.foreground,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  itemCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e8e3dc',
  },
  cardHeaderPressable: {
    width: '100%',
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#eee9e2',
  },
  placeholderContainer: {
    width: '100%',
    height: 110,
    backgroundColor: '#eee9e2',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  placeholderIcon: {
    fontSize: 26,
  },
  placeholderCategory: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedForeground,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  typeTextLost: {
    color: colors.destructive,
  },
  typeTextFound: {
    color: colors.success,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  statusTextOpen: {
    color: colors.success,
  },
  statusTextClaimed: {
    color: colors.warning,
  },
  statusTextResolved: {
    color: colors.mutedForeground,
  },
  statusTextExpired: {
    color: colors.mutedForeground,
  },
  postedDateText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.mutedForeground,
  },
  itemTitle: {
    ...typography.heading,
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
    lineHeight: 22,
    marginBottom: 4,
  },
  locationText: {
    ...typography.body,
    fontSize: 13,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  actionsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#f0ece6',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {},
  editBtnText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
  },
  claimBtn: {},
  claimBtnText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: colors.warning,
  },
  resolveBtn: {},
  resolveBtnText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },
  reopenBtn: {},
  reopenBtnText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  deleteBtn: {},
  deleteBtnText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: colors.destructive,
  },
  emptyCtaWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
