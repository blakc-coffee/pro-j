import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import AppNavBar from '../../../components/AppNavBar';
import AppShell from '../../../components/AppShell';
import FormInput from '../../../components/FormInput';
import PrimaryButton from '../../../components/PrimaryButton';
import RideCard from '../components/RideCard';
import ScreenState from '../../../components/ScreenState';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import { listRides } from '../services/rides';
import { isFullRide, sortRidesAvailableFirst } from '../../../utils/format';

const FILTERS = ['All', 'Open', 'Full'];

export default function CabsScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadRides = useCallback(async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const data = await listRides();
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => (Number(b.cab_id) || 0) - (Number(a.cab_id) || 0))
        : [];
      setRides(sorted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRides();
    }, [loadRides])
  );

  const visibleRides = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = rides.filter((ride) => {
      if (filter === 'Open' && isFullRide(ride)) return false;
      if (filter === 'Full' && !isFullRide(ride)) return false;

      if (query) {
        const from = (ride.from_loc || '').toLowerCase();
        const to = (ride.to_loc || '').toLowerCase();
        if (!from.includes(query) && !to.includes(query)) {
          return false;
        }
      }
      return true;
    });

    return sortRidesAvailableFirst(filtered);
  }, [rides, filter, search]);

  return (
    <AppShell safeTop>
      <View style={styles.screen}>
        <AppNavBar />
        <View style={styles.controls}>
          <FormInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by location..."
            returnKeyType="search"
          />

          <View style={styles.filters}>
            {FILTERS.map((item) => {
              const active = item === filter;
              return (
                <Pressable
                  key={item}
                  onPress={() => setFilter(item)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <ScreenState
          loading={loading && !refreshing}
          error={error}
          empty={!loading && !error && visibleRides.length === 0}
          emptyMessage="No rides match this search yet."
        >
          <FlatList
            data={visibleRides}
            keyExtractor={(item) => String(item.cab_id)}
            renderItem={({ item }) => <RideCard ride={item} />}
            contentContainerStyle={styles.list}
            refreshing={refreshing}
            onRefresh={() => loadRides(true)}
          />
        </ScreenState>

        <View style={styles.fab}>
          <PrimaryButton
            label="Post Ride"
            tone="primary"
            onPress={() => navigation.navigate('PostRide')}
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
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chip: {
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  chipText: {
    ...typography.label,
    color: colors.mutedForeground,
  },
  chipTextActive: {
    color: colors.white,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 96,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    left: spacing.lg,
    bottom: spacing.lg,
  },
});
