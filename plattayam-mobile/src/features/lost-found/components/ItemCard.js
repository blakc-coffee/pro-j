import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import Card from '../../../components/Card';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';

const lostFoundIcon = require('../../../../assets/icon-lostfound.png');

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

export default function ItemCard({ item, onPress }) {
  if (!item) return null;

  const isLost = item.type === 'lost';
  const hasImage = !!(item.image_url || item.imageUrl);
  const imageUrl = item.image_url || item.imageUrl;
  const postedText = formatPostedDate(item.created_at || item.createdAt);

  return (
    <Card style={styles.card}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.pressable, pressed && onPress && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${item.type ? item.type.toUpperCase() : 'ITEM'}: ${item.title}`}
      >
        {/* Dominant Image / Clean Placeholder Header */}
        {hasImage ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Image
              source={lostFoundIcon}
              style={styles.placeholderIconImage}
              resizeMode="contain"
            />
            {item.category ? (
              <Text style={styles.placeholderCategory}>{item.category}</Text>
            ) : null}
          </View>
        )}

        {/* Card Content Area */}
        <View style={styles.body}>
            {/* Top Line: Plain Status Text (LOST / FOUND) + Date Posted */}
            <View style={styles.metaRow}>
              <Text
                style={[
                  styles.typeText,
                  isLost ? styles.typeTextLost : styles.typeTextFound,
                ]}
              >
                {isLost ? 'LOST' : 'FOUND'}
              </Text>

              {postedText ? (
                <Text style={styles.postedDateText}>
                  Posted {postedText}
                </Text>
              ) : null}
            </View>

          {/* Item Name */}
          <Text style={styles.title} numberOfLines={2}>
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
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e8e3dc',
  },
  pressable: {
    flex: 1,
  },
  pressed: {
    opacity: 0.9,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#eee9e2',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#eee9e2',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  placeholderIconImage: {
    width: 32,
    height: 32,
    tintColor: colors.mutedForeground,
  },
  placeholderCategory: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  body: {
    padding: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  typeText: {
    fontSize: 12,
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
  postedDateText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.mutedForeground,
  },
  title: {
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
});

