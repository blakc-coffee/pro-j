import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import AppHeader from '../../../components/AppHeader';
import AppShell from '../../../components/AppShell';
import PrimaryButton from '../../../components/PrimaryButton';
import RideCard from '../components/RideCard';
import ScreenState from '../../../components/ScreenState';
import StatusBadge from '../../../components/StatusBadge';
import { colors } from '../../../constants/colors';
import { spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import {
  deleteRideRequest,
  listMyRequests,
  listMyRides,
} from '../services/rides';

export default function MyRidesScreen() {
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState('posted'); // 'posted' | 'requests'
  const [postedRides, setPostedRides] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [postedData, reqsData] = await Promise.all([
        listMyRides(),
        listMyRequests(),
      ]);
      setPostedRides(Array.isArray(postedData) ? postedData : []);
      setRequests(Array.isArray(reqsData) ? reqsData : []);
    } catch (err) {
      setError(err.message || 'Could not load your rides.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function handleCancelRequest(cabId) {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this ride request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(cabId);
            try {
              await deleteRideRequest(cabId);
              loadData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not cancel request.');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  }

  const currentData = activeTab === 'posted' ? postedRides : requests;
  const isEmpty = !loading && !error && currentData.length === 0;

  return (
    <AppShell>
      <View style={styles.screen}>
        <AppHeader
          title="My Rides"
          subtitle="Your posted rides and requests"
          onBack={() => navigation.goBack()}
        />

        {/* Tab Switcher */}
        <View style={styles.tabsContainer}>
          <Pressable
            onPress={() => setActiveTab('posted')}
            style={[styles.tab, activeTab === 'posted' && styles.activeTab]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'posted' }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'posted' && styles.activeTabText,
              ]}
            >
              Posted Rides ({postedRides.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('requests')}
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'requests' }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'requests' && styles.activeTabText,
              ]}
            >
              My Requests ({requests.length})
            </Text>
          </Pressable>
        </View>

        <ScreenState
          loading={loading}
          error={error}
          onRetry={loadData}
          empty={isEmpty}
          emptyMessage={
            activeTab === 'posted'
              ? 'You have not posted any rides yet.'
              : 'You have not requested to join any rides yet.'
          }
        >
          {activeTab === 'posted' ? (
            <FlatList
              data={postedRides}
              keyExtractor={(item) => String(item.cab_id)}
              renderItem={({ item }) => <RideCard ride={item} />}
              contentContainerStyle={styles.list}
            />
          ) : (
            <FlatList
              data={requests}
              keyExtractor={(item) =>
                item.request_id || item.cab_id || String(Math.random())
              }
              renderItem={({ item }) => (
                <View style={styles.requestItem}>
                  <RideCard ride={item} />
                  <View style={styles.requestStatusRow}>
                    <StatusBadge status={item.status} />
                    {item.status === 'pending' || item.status === 'accepted' ? (
                      <PrimaryButton
                        label="Cancel Request"
                        tone="outline"
                        loading={cancellingId === item.cab_id}
                        onPress={() => handleCancelRequest(item.cab_id)}
                      />
                    ) : null}
                  </View>
                </View>
              )}
              contentContainerStyle={styles.list}
            />
          )}
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.label,
    color: colors.mutedForeground,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '700',
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  requestItem: {
    marginBottom: spacing.md,
  },
  requestStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
});
