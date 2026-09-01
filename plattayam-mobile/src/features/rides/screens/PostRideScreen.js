import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import AppHeader from '../../../components/AppHeader';
import AppShell from '../../../components/AppShell';
import Card from '../../../components/Card';
import FormInput from '../../../components/FormInput';
import PrimaryButton from '../../../components/PrimaryButton';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import { postRide } from '../services/rides';

export default function PostRideScreen() {
  const navigation = useNavigation();

  const [fromLoc, setFromLoc] = useState('');
  const [toLoc, setToLoc] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seatsAvbl, setSeatsAvbl] = useState('3');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const nextErrors = {};

    if (!fromLoc.trim()) {
      nextErrors.fromLoc = 'Origin location is required';
    }
    if (!toLoc.trim()) {
      nextErrors.toLoc = 'Destination location is required';
    }
    if (!date.trim()) {
      nextErrors.date = 'Date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      nextErrors.date = 'Format must be YYYY-MM-DD (e.g. 2026-03-15)';
    }

    if (!time.trim()) {
      nextErrors.time = 'Time is required';
    } else if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time.trim())) {
      nextErrors.time = 'Format must be HH:MM (e.g. 14:30)';
    }

    const seatsNum = parseInt(seatsAvbl, 10);
    if (!seatsAvbl.trim() || isNaN(seatsNum) || seatsNum < 1 || seatsNum > 20) {
      nextErrors.seatsAvbl = 'Seats must be between 1 and 20';
    }

    if (cost.trim() && (isNaN(Number(cost)) || Number(cost) < 0)) {
      nextErrors.cost = 'Please enter a valid cost (e.g. 150)';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const formattedTime = time.trim().length === 5 ? `${time.trim()}:00` : time.trim();

      await postRide({
        from_loc: fromLoc.trim(),
        to_loc: toLoc.trim(),
        date: date.trim(),
        time: formattedTime,
        seats_avbl: parseInt(seatsAvbl, 10),
        price: cost.trim() ? parseFloat(cost) : undefined,
        notes: notes.trim() || undefined,
      });

      Alert.alert('Success', 'Your ride has been posted!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not post ride. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <View style={styles.screen}>
        <AppHeader title="Post a Ride" onBack={() => navigation.goBack()} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            <Card padding="lg" style={styles.formCard}>
              <FormInput
                label="Leaving From *"
                value={fromLoc}
                onChangeText={(text) => {
                  setFromLoc(text);
                  if (errors.fromLoc) setErrors((e) => ({ ...e, fromLoc: '' }));
                }}
                placeholder="e.g. Campus Gate 1, Hostel Block A"
                error={errors.fromLoc}
                autoCapitalize="words"
              />

              <FormInput
                label="Heading To *"
                value={toLoc}
                onChangeText={(text) => {
                  setToLoc(text);
                  if (errors.toLoc) setErrors((e) => ({ ...e, toLoc: '' }));
                }}
                placeholder="e.g. Kottayam Railway Station, Airport"
                error={errors.toLoc}
                autoCapitalize="words"
              />

              <View style={styles.row}>
                <View style={styles.halfCol}>
                  <FormInput
                    label="Date (YYYY-MM-DD) *"
                    value={date}
                    onChangeText={(text) => {
                      setDate(text);
                      if (errors.date) setErrors((e) => ({ ...e, date: '' }));
                    }}
                    placeholder="2026-03-15"
                    error={errors.date}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.halfCol}>
                  <FormInput
                    label="Time (HH:MM) *"
                    value={time}
                    onChangeText={(text) => {
                      setTime(text);
                      if (errors.time) setErrors((e) => ({ ...e, time: '' }));
                    }}
                    placeholder="14:30"
                    error={errors.time}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfCol}>
                  <FormInput
                    label="Available Seats *"
                    value={seatsAvbl}
                    onChangeText={(text) => {
                      setSeatsAvbl(text);
                      if (errors.seatsAvbl) setErrors((e) => ({ ...e, seatsAvbl: '' }));
                    }}
                    placeholder="3"
                    keyboardType="numeric"
                    error={errors.seatsAvbl}
                  />
                </View>

                <View style={styles.halfCol}>
                  <FormInput
                    label="Cost per seat (₹)"
                    value={cost}
                    onChangeText={(text) => {
                      setCost(text);
                      if (errors.cost) setErrors((e) => ({ ...e, cost: '' }));
                    }}
                    placeholder="Optional (e.g. 150)"
                    keyboardType="numeric"
                    error={errors.cost}
                  />
                </View>
              </View>

              <FormInput
                label="Notes (Optional)"
                value={notes}
                onChangeText={setNotes}
                placeholder="Any special instructions, luggage details, etc."
                multiline
                numberOfLines={3}
              />

              <View style={styles.submitContainer}>
                <PrimaryButton
                  label="Publish Ride"
                  tone="primary"
                  loading={loading}
                  onPress={handleSubmit}
                />
              </View>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  body: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfCol: {
    flex: 1,
  },
  submitContainer: {
    marginTop: spacing.md,
  },
});
