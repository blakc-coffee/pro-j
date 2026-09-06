import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

import AppHeader from '../../../components/AppHeader';
import AppShell from '../../../components/AppShell';
import Card from '../../../components/Card';
import ScreenState from '../../../components/ScreenState';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import { useAuth } from '../../../context/AuthContext';
import { formatDate, formatFullName } from '../../../utils/format';
import {
  addMessage,
  deleteItem,
  getItem,
  listMessages,
  updateItemStatus,
} from '../services/lostfound';

function formatPostedDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function ItemDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const currentUserId = String(user?.user_id ?? user?.id ?? '');

  const itemId = route.params?.itemId;

  const [item, setItem] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [postingMessage, setPostingMessage] = useState(false);
  const [messageError, setMessageError] = useState('');

  const loadData = useCallback(async () => {
    if (!itemId) return;
    setError('');
    try {
      const [itemRes, messagesRes] = await Promise.all([
        getItem(itemId),
        listMessages(itemId).catch(() => []),
      ]);
      setItem(itemRes);
      setMessages(Array.isArray(messagesRes) ? messagesRes : itemRes.messages || []);
    } catch (err) {
      setError(err.message || 'Failed to load item details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [itemId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Ownership Check
  const posterUserId = String(item?.user_id ?? item?.userId ?? '');
  const isOwner = !!(currentUserId && posterUserId && currentUserId === posterUserId);

  // Status Actions (Owner only) with confirmation
  const handleStatusUpdate = (newStatus) => {
    if (!isOwner || actionBusy) return;
    const actionName = newStatus === 'claimed' ? 'Claimed' : newStatus === 'resolved' ? 'Resolved' : 'Open';
    Alert.alert(
      `Mark as ${actionName}?`,
      newStatus === 'open'
        ? 'This will reopen the listing and make it visible in the active marketplace.'
        : `This will mark the item as ${newStatus} and remove it from the active Lost & Found marketplace.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Mark ${actionName}`,
          onPress: async () => {
            setActionBusy(true);
            try {
              const updated = await updateItemStatus(itemId, newStatus);
              setItem(updated);
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to update status.');
            } finally {
              setActionBusy(false);
            }
          },
        },
      ]
    );
  };

  // Delete Action (Owner only)
  const handleDelete = () => {
    if (!isOwner || actionBusy) return;
    Alert.alert(
      'Delete Listing?',
      'This cannot be undone. Are you sure you want to permanently delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionBusy(true);
            try {
              await deleteItem(itemId);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete listing.');
              setActionBusy(false);
            }
          },
        },
      ]
    );
  };

  // Message Posting
  const handlePostMessage = async () => {
    if (!newMessage.trim() || postingMessage) return;
    setPostingMessage(true);
    setMessageError('');
    try {
      const createdMsg = await addMessage(itemId, newMessage.trim());
      setMessages((prev) => [...prev, createdMsg]);
      setNewMessage('');
    } catch (err) {
      setMessageError(err.message || 'Could not post message.');
    } finally {
      setPostingMessage(false);
    }
  };

  const isLost = item?.type === 'lost';
  const hasImage = !!(item?.image_url || item?.imageUrl);
  const imageUrl = item?.image_url || item?.imageUrl;
  const posterName = formatFullName(item?.user_name || item?.userName) || item?.user_name || 'Campus Member';
  const isClaimedOrResolved = item?.status === 'claimed' || item?.status === 'resolved';

  return (
    <AppShell>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <AppHeader
          title="Item Details"
          subtitle={item?.category ? `${item.category} • Lost & Found` : 'Lost & Found'}
          onBack={() => navigation.goBack()}
        />

        <ScreenState
          loading={loading && !refreshing}
          error={error}
          onRetry={loadData}
          empty={!item}
          emptyMessage="Item not found."
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Status Inactive Alert Banner */}
            {isClaimedOrResolved ? (
              <View
                style={[
                  styles.statusBanner,
                  item.status === 'claimed'
                    ? styles.statusBannerClaimed
                    : styles.statusBannerResolved,
                ]}
              >
                <Text style={styles.statusBannerText}>
                  This item has been marked as{' '}
                  <Text style={styles.statusBannerBold}>
                    {item.status.toUpperCase()}
                  </Text>{' '}
                  and is closed.
                </Text>
              </View>
            ) : null}

            {/* 1. Large Image / Placeholder */}
            <Card style={styles.imageCard}>
              {hasImage ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.heroPlaceholder}>
                  <Text style={styles.placeholderIcon}>
                    {isLost ? '🔍' : '📦'}
                  </Text>
                  <Text style={styles.placeholderCategory}>
                    {item?.category || 'CAMPUS ITEM'}
                  </Text>
                </View>
              )}
            </Card>

            {/* 2. Main Item Details Card */}
            <Card padding="lg" style={styles.sectionCard}>
              {/* Type + Status (Plain Text Design Rule) */}
              <View style={styles.badgeRow}>
                <Text
                  style={[
                    styles.typeText,
                    isLost ? styles.typeTextLost : styles.typeTextFound,
                  ]}
                >
                  {isLost ? 'LOST ITEM' : 'FOUND ITEM'}
                </Text>

                <Text
                  style={[
                    styles.statusText,
                    item?.status === 'open' ? styles.statusTextOpen : styles.statusTextClosed,
                  ]}
                >
                  {(item?.status || 'open').toUpperCase()}
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.title}>{item?.title}</Text>

              {/* Key Details Grid */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>
                    {isLost ? 'Date Lost' : 'Date Found'}
                  </Text>
                  <Text style={styles.detailValue}>
                    {formatDate(item?.item_date || item?.itemDate)}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Date Posted</Text>
                  <Text style={styles.detailValue}>
                    {formatPostedDate(item?.created_at || item?.createdAt)}
                  </Text>
                </View>

                <View style={styles.detailItemFull}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>
                    📍 {item?.location || '—'}
                  </Text>
                </View>
              </View>

              {/* Description */}
              {item?.description ? (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.descriptionText}>{item.description}</Text>
                </View>
              ) : null}

              {/* Poster & Contact Information */}
              <View style={styles.posterSection}>
                <Text style={styles.detailLabel}>Reported By</Text>
                <Text style={styles.posterNameText}>{posterName}</Text>
                {item?.contact_info ? (
                  <View style={styles.contactContainer}>
                    <Text style={styles.contactLabel}>Contact Details:</Text>
                    <Text style={styles.contactValueText}>{item.contact_info}</Text>
                  </View>
                ) : null}
              </View>
            </Card>

            {/* 3. Owner Actions Section (Only visible to listing creator) */}
            {isOwner ? (
              <Card padding="lg" style={styles.ownerCard}>
                <Text style={styles.ownerTitle}>Listing Management (Owner)</Text>
                <Text style={styles.ownerSubtitle}>
                  You reported this item. You can update its status or remove the listing.
                </Text>

                <View style={styles.ownerActions}>
                  <Pressable
                    onPress={() => navigation.navigate('ReportItem', { itemId: item.id })}
                    disabled={actionBusy}
                    style={[styles.ownerButton, styles.editOwnerButton]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.editOwnerButtonText}>Edit Item</Text>
                  </Pressable>

                  {item?.status === 'open' ? (
                    <>
                      <Pressable
                        onPress={() => handleStatusUpdate('claimed')}
                        disabled={actionBusy}
                        style={[styles.ownerButton, styles.claimedButton]}
                        accessibilityRole="button"
                      >
                        <Text style={styles.claimedButtonText}>
                          Mark as Claimed
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleStatusUpdate('resolved')}
                        disabled={actionBusy}
                        style={[styles.ownerButton, styles.resolvedButton]}
                        accessibilityRole="button"
                      >
                        <Text style={styles.resolvedButtonText}>
                          Mark as Resolved
                        </Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      onPress={() => handleStatusUpdate('open')}
                      disabled={actionBusy}
                      style={[styles.ownerButton, styles.reopenButton]}
                      accessibilityRole="button"
                    >
                      <Text style={styles.reopenButtonText}>
                        Reopen Listing
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={handleDelete}
                    disabled={actionBusy}
                    style={[styles.ownerButton, styles.deleteButton]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.deleteButtonText}>Delete Listing</Text>
                  </Pressable>
                </View>
              </Card>
            ) : null}

            {/* 4. Contextual Messages Section */}
            <Card padding="lg" style={styles.sectionCard}>
              <Text style={styles.messagesHeader}>
                Messages & Context ({messages.length})
              </Text>
              <Text style={styles.messagesSubheader}>
                Saw this item or have information? Post a message below to help out.
              </Text>

              {/* Message List */}
              {messages.length === 0 ? (
                <View style={styles.noMessagesContainer}>
                  <Text style={styles.noMessagesText}>
                    No messages yet. Be the first to leave contextual details!
                  </Text>
                </View>
              ) : (
                <View style={styles.messagesList}>
                  {messages.map((msg) => {
                    const msgUser = formatFullName(msg.user_name) || msg.user_name || `User ${msg.user_id}`;
                    return (
                      <View key={msg.id} style={styles.messageBubble}>
                        <View style={styles.messageMetaRow}>
                          <Text style={styles.messageSender}>{msgUser}</Text>
                          <Text style={styles.messageTime}>
                            {formatPostedDate(msg.created_at)}
                          </Text>
                        </View>
                        <Text style={styles.messageContent}>{msg.message}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Add Message Form */}
              <View style={styles.addMessageContainer}>
                {messageError ? (
                  <Text style={styles.messageErrorText}>{messageError}</Text>
                ) : null}

                <View style={styles.messageInputRow}>
                  <TextInput
                    placeholder="Type a message or location update..."
                    placeholderTextColor="#999388"
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                    style={styles.messageTextInput}
                  />

                  <Pressable
                    onPress={handlePostMessage}
                    disabled={postingMessage || !newMessage.trim()}
                    style={[
                      styles.sendButton,
                      (!newMessage.trim() || postingMessage) && styles.sendButtonDisabled,
                    ]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.sendButtonText}>
                      {postingMessage ? '...' : 'Send'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Card>
          </ScrollView>
        </ScreenState>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  statusBanner: {
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  statusBannerClaimed: {},
  statusBannerResolved: {},
  statusBannerText: {
    ...typography.body,
    fontSize: 13,
    color: colors.foreground,
  },
  statusBannerBold: {
    fontWeight: '700',
  },
  imageCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e8e3dc',
  },
  heroImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#eee9e2',
  },
  heroPlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#eee9e2',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderIcon: {
    fontSize: 40,
  },
  placeholderCategory: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: colors.mutedForeground,
    letterSpacing: 0.8,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  typeTextLost: {
    color: colors.destructive,
  },
  typeTextFound: {
    color: colors.success,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statusTextOpen: {
    color: colors.success,
  },
  statusTextClosed: {
    color: colors.mutedForeground,
  },
  title: {
    ...typography.heading,
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
    lineHeight: 26,
    marginBottom: spacing.md,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fbfaf8',
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#eee9e2',
  },
  detailItem: {
    flex: 1,
    minWidth: 120,
  },
  detailItemFull: {
    width: '100%',
  },
  detailLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedForeground,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  descriptionContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  descriptionText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.foreground,
    marginTop: 4,
  },
  posterSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  posterNameText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 2,
  },
  contactContainer: {
    marginTop: spacing.xs,
    backgroundColor: colors.primarySoft,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  contactLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  contactValueText: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
  },
  ownerCard: {
    backgroundColor: '#fefcf8',
    borderWidth: 1.5,
    borderColor: '#e8dcce',
    marginBottom: spacing.md,
  },
  ownerTitle: {
    ...typography.heading,
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 4,
  },
  ownerSubtitle: {
    ...typography.caption,
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: spacing.md,
  },
  ownerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  ownerButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editOwnerButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editOwnerButtonText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
  },
  claimedButton: {
    backgroundColor: colors.warningSoft,
  },
  claimedButtonText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: colors.warning,
  },
  resolvedButton: {
    backgroundColor: colors.successSoft,
  },
  resolvedButtonText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },
  reopenButton: {
    backgroundColor: colors.primarySoft,
  },
  reopenButtonText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.destructiveSoft,
  },
  deleteButtonText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: colors.destructive,
  },
  messagesHeader: {
    ...typography.heading,
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 2,
  },
  messagesSubheader: {
    ...typography.caption,
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: spacing.md,
  },
  noMessagesContainer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  noMessagesText: {
    ...typography.caption,
    color: colors.mutedForeground,
    fontStyle: 'italic',
  },
  messagesList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  messageBubble: {
    backgroundColor: '#f7f5f2',
    borderWidth: 1,
    borderColor: '#e8e3dc',
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  messageMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  messageSender: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  messageTime: {
    ...typography.caption,
    fontSize: 11,
    color: colors.mutedForeground,
  },
  messageContent: {
    ...typography.body,
    fontSize: 13,
    color: colors.foreground,
    lineHeight: 18,
  },
  addMessageContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  messageErrorText: {
    ...typography.caption,
    color: colors.destructive,
    marginBottom: 6,
  },
  messageInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  messageTextInput: {
    flex: 1,
    backgroundColor: '#f7f5f2',
    borderWidth: 1,
    borderColor: '#e2ddd5',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    fontSize: 13,
    color: colors.foreground,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryForeground,
  },
});
