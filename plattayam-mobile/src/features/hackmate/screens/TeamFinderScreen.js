import { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import AppHeader from '../../../components/AppHeader';
import AppShell from '../../../components/AppShell';
import FormInput from '../../../components/FormInput';
import PrimaryButton from '../../../components/PrimaryButton';
import ScreenState from '../../../components/ScreenState';
import FilterChips from '../components/FilterChips';
import PeopleCard from '../components/PeopleCard';
import SegmentedControl from '../components/SegmentedControl';
import TeamCard from '../components/TeamCard';
import { colors } from '../../../constants/colors';
import { spacing } from '../../../constants/spacing';
import { listPeople, listTeams } from '../services/hackfind';

const TEAM_FILTERS = ['All', 'Looking for members', 'Full'];
const PEOPLE_FILTERS = ['All', 'Open to join'];

export default function TeamFinderScreen() {
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState('Teams'); // 'Teams' | 'People'
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const [teams, setTeams] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setError('');
    try {
      if (activeTab === 'Teams') {
        const res = await listTeams({ search, filter: selectedFilter });
        setTeams(res);
      } else {
        const res = await listPeople({ search, filter: selectedFilter });
        setPeople(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to load HackMate marketplace data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, search, selectedFilter]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedFilter('All');
    setLoading(true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const currentFilters = activeTab === 'Teams' ? TEAM_FILTERS : PEOPLE_FILTERS;
  const currentList = activeTab === 'Teams' ? teams : people;
  const isEmpty = !loading && !error && currentList.length === 0;

  return (
    <AppShell>
      <View style={styles.screen}>
        {/* Header */}
        <AppHeader
          title="HackMate"
          subtitle="Find teammates, discover teams & build projects"
          actionLabel="My Profile"
          onAction={() => navigation.navigate('HackFindHub')}
        />

        <View style={styles.body}>
          {/* Search Input */}
          <FormInput
            placeholder="Search teams, people, skills, hackathons..."
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            style={styles.searchInput}
          />

          {/* Segmented Control: Teams | People */}
          <SegmentedControl
            options={['Teams', 'People']}
            selected={activeTab}
            onSelect={handleTabChange}
          />
        </View>

        {/* Filter Chips */}
        <FilterChips
          filters={currentFilters}
          selected={selectedFilter}
          onSelect={setSelectedFilter}
        />

        {/* Feed List */}
        <ScreenState
          loading={loading && !refreshing}
          error={error}
          onRetry={loadData}
          empty={isEmpty}
          emptyMessage={
            activeTab === 'Teams'
              ? 'No teams found matching your search.'
              : 'No candidate cards found matching your search.'
          }
        >
          <FlatList
            data={currentList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) =>
              activeTab === 'Teams' ? (
                <TeamCard
                  team={item}
                  onPress={() => navigation.navigate('TeamDetails', { teamId: item.id })}
                />
              ) : (
                <PeopleCard
                  person={item}
                  onPress={() => navigation.navigate('CandidateProfile', { personId: item.id })}
                />
              )
            }
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

        {/* Floating Action CTA matching Cabs layout */}
        <View style={styles.fab}>
          {activeTab === 'Teams' ? (
            <PrimaryButton
              label="Create a Team"
              tone="primary"
              onPress={() => navigation.navigate('CreateTeam')}
            />
          ) : (
            <PrimaryButton
              label="Post Profile Card"
              tone="primary"
              onPress={() => navigation.navigate('CreateProfileCard')}
            />
          )}
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
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.xs,
  },
  searchInput: {
    marginBottom: spacing.xs,
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
