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

import AppShell from '../../../components/AppShell';
import FormInput from '../../../components/FormInput';
import PrimaryButton from '../../../components/PrimaryButton';
import ScreenState from '../../../components/ScreenState';
import ItemCard from '../components/ItemCard';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import { listItems } from '../services/lostfound';

const TYPE_OPTIONS = ['All', 'Lost', 'Found'];
const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
];

export default function LostFoundScreen() {
  const navigation = useNavigation();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedSort, setSelectedSort] = useState('newest');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setError('');
    try {
      const filters = {
        status: 'open',
        sort: selectedSort,
      };
      if (selectedType !== 'All') {
        filters.type = selectedType.toLowerCase();
      }
      if (search && search.trim()) {
        filters.search = search.trim();
      }

      const res = await listItems(filters);
      setItems(Array.isArray(res) ? res : []);
    } catch (err) {
      setError(err.message || 'Failed to load lost & found items.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedType, selectedSort]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setLoading(true);
  };

  const handleSortChange = (sort) => {
    setSelectedSort(sort);
    setLoading(true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleReportPress = () => {
    navigation.navigate('ReportItem');
  };

  const isEmpty = !loading && !error && items.length === 0;

  return (
    <AppShell safeTop>
      <View style={styles.screen}>
        <View style={styles.controls}>
          {/* Search Input */}
          <FormInput
            placeholder="Search lost & found items..."
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={loadData}
            style={styles.searchInput}
          />

          {/* Type Filter Segmented Control: All | Lost | Found */}
          <View style={styles.segmentedContainer}>
            {TYPE_OPTIONS.map((opt) => {
              const active = opt === selectedType;
              return (
                <Pressable
                  key={opt}
                  onPress={() => handleTypeChange(opt)}
                  style={[styles.segment, active && styles.segmentActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Sort By Control (Date Posted: Newest / Oldest) */}
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by Date Posted:</Text>
            <View style={styles.sortChips}>
              {SORT_OPTIONS.map((opt) => {
                const active = selectedSort === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => handleSortChange(opt.value)}
                    style={[styles.sortChip, active && styles.sortChipActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Feed List */}
        <ScreenState
          loading={loading && !refreshing}
          error={error}
          onRetry={loadData}
          empty={isEmpty}
          emptyMessage="No open lost or found items found matching your filters."
        >
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ItemCard
                item={item}
                onPress={() => {
                  navigation.navigate('ItemDetails', { itemId: item.id });
                }}
              />
            )}
            style={styles.feedList}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
          />
        </ScreenState>

        {/* Floating Bottom CTA */}
        <View style={styles.fab}>
          <PrimaryButton
            label="Report Item"
            tone="primary"
            onPress={handleReportPress}
          />
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  controls: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.xs,
  },
  searchInput: {
    marginBottom: spacing.xs,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#e8e3dc',
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.sm,
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
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: spacing.xs,
  },
  sortLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  sortChips: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sortChip: {
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#e8e3dc',
  },
  sortChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortChipText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.foreground,
  },
  sortChipTextActive: {
    color: colors.primaryForeground,
  },
  feedList: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 96,
    justifyContent: 'flex-start',
    flexGrow: 0,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    left: spacing.lg,
    bottom: spacing.lg,
  },
});
