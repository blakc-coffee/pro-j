import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import AppHeader from '../components/AppHeader';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../constants/colors';
import { radius, spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { createRide } from '../services/rides';
import { toApiTime } from '../utils/format';

const MIN_SEATS = 1;
const MAX_SEATS = 8;

export default function PostRideScreen() {
  const navigation = useNavigation();
  const [fromLoc, setFromLoc] = useState('');
  const [toLoc, setToLoc] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [depTime, setDepTime] = useState('');
  const [seats, setSeats] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function validate() {
    if (!fromLoc.trim() || !toLoc.trim()) {
      return 'From and To are required.';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(travelDate.trim())) {
      return 'Travel date must be YYYY-MM-DD.';
    }
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(depTime.trim())) {
      return 'Departure must be HH:MM.';
    }
    return '';
  }

  async function onSubmit() {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const ride = await createRide({
        from_loc: fromLoc.trim(),
        to_loc: toLoc.trim(),
        travel_date: travelDate.trim(),
        dep_time: toApiTime(depTime.trim()),
        seats_avbl: seats,
      });
      navigation.replace('RideDetails', { cabId: ride.cab_id });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader
        title="Post Ride"
        subtitle="Share empty seats on your cab"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>From</Text>
        <TextInput
          value={fromLoc}
          onChangeText={setFromLoc}
          placeholder="Campus / city"
          placeholderTextColor={colors.mutedForeground}
          style={styles.input}
        />

        <Text style={styles.label}>To</Text>
        <TextInput
          value={toLoc}
          onChangeText={setToLoc}
          placeholder="Destination"
          placeholderTextColor={colors.mutedForeground}
          style={styles.input}
        />

        <Text style={styles.label}>Travel Date</Text>
        <TextInput
          value={travelDate}
          onChangeText={setTravelDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.mutedForeground}
          style={styles.input}
        />

        <Text style={styles.label}>Departure</Text>
        <TextInput
          value={depTime}
          onChangeText={setDepTime}
          placeholder="HH:MM"
          placeholderTextColor={colors.mutedForeground}
          style={styles.input}
        />

        <Text style={styles.label}>Seats Available</Text>
        <View style={styles.stepper}>
          <Pressable
            style={styles.step}
            onPress={() => setSeats((value) => Math.max(MIN_SEATS, value - 1))}
          >
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.seats}>{seats}</Text>
          <Pressable
            style={styles.step}
            onPress={() => setSeats((value) => Math.min(MAX_SEATS, value + 1))}
          >
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton label="Post ride" loading={loading} onPress={onSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  label: {
    ...typography.label,
    color: colors.foreground,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.foreground,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  step: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: '700',
  },
  seats: {
    ...typography.title,
    color: colors.foreground,
    minWidth: 32,
    textAlign: 'center',
  },
  error: {
    color: colors.destructive,
    marginBottom: spacing.md,
  },
});
