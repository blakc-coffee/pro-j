import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import AppHeader from '../components/AppHeader';
import PrimaryButton from '../components/PrimaryButton';
import RideCard from '../components/RideCard';
import ScreenState from '../components/ScreenState';
import { colors } from '../constants/colors';
import { radius, spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { listRides } from '../services/rides';
import { isFullRide } from '../utils/format';

const FILTERS = ['All', 'Open', 'Full'];

export default function CabsScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRides = useCallback(async (location = '') => {
    setLoading(true);
    setError('');
    try {
      const data = await listRides(location.trim());
      setRides(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRides();
    }, [loadRides])
  );

  const visibleRides = useMemo(() => {
    return rides.filter((ride) => {
      if (filter === 'Open') {
        return !isFullRide(ride);
      }
      if (filter === 'Full') {
        return isFullRide(ride);
      }
      return true;
    });
  }, [rides, filter]);

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Cabs"
        subtitle="Find or post a shared ride from campus"
      />

      <View style={styles.controls}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => loadRides(search)}
          placeholder="Search from location"
          placeholderTextColor={colors.mutedForeground}
          style={styles.search}
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
        loading={loading}
        error={error}
        empty={!loading && !error && visibleRides.length === 0}
        emptyMessage="No rides match this search yet."
      >
        <FlatList
          data={visibleRides}
          keyExtractor={(item) => String(item.cab_id)}
          renderItem={({ item }) => <RideCard ride={item} />}
          contentContainerStyle={styles.list}
        />
      </ScreenState>

      <View style={styles.fab}>
        <PrimaryButton
          label="Post Ride"
          tone="accent"
          onPress={() => navigation.navigate('PostRide')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  controls: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  search: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.foreground,
    ...typography.body,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    backgroundColor: colors.secondary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    ...typography.label,
    color: colors.foreground,
  },
  chipTextActive: {
    color: colors.primaryForeground,
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
