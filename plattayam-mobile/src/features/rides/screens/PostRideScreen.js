import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [notes, setNotes] = useState('');

  // Native Date and Time Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Android Picker Handlers
  const onAndroidDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
      if (errors.date) setErrors((e) => ({ ...e, date: '' }));
    }
  };

  const onAndroidTimeChange = (event, selectedDate) => {
    setShowTimePicker(false);
    if (event.type === 'set' && selectedDate) {
      const hh = String(selectedDate.getHours()).padStart(2, '0');
      const mm = String(selectedDate.getMinutes()).padStart(2, '0');
      setTime(`${hh}:${mm}`);
      if (errors.time) setErrors((e) => ({ ...e, time: '' }));
    }
  };

  // iOS Picker Handlers
  const onIOSDateChange = (event, selectedDate) => {
    if (selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
      if (errors.date) setErrors((e) => ({ ...e, date: '' }));
    }
  };

  const onIOSTimeChange = (event, selectedDate) => {
    if (selectedDate) {
      const hh = String(selectedDate.getHours()).padStart(2, '0');
      const mm = String(selectedDate.getMinutes()).padStart(2, '0');
      setTime(`${hh}:${mm}`);
      if (errors.time) setErrors((e) => ({ ...e, time: '' }));
    }
  };

  const handleDoneDatePicker = () => {
    if (!date) {
      const d = getDateValue();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
      if (errors.date) setErrors((e) => ({ ...e, date: '' }));
    }
    setShowDatePicker(false);
  };

  const handleDoneTimePicker = () => {
    if (!time) {
      const d = getTimeValue();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      setTime(`${hh}:${mm}`);
      if (errors.time) setErrors((e) => ({ ...e, time: '' }));
    }
    setShowTimePicker(false);
  };

  const getDateValue = () => {
    if (!date) return new Date();
    const parts = date.split('-');
    if (parts.length === 3) {
      const yyyy = parseInt(parts[0], 10);
      const mm = parseInt(parts[1], 10) - 1;
      const dd = parseInt(parts[2], 10);
      const d = new Date(yyyy, mm, dd);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };

  const getTimeValue = () => {
    if (!time) return new Date();
    const parts = time.split(':');
    if (parts.length >= 2) {
      const hh = parseInt(parts[0], 10);
      const mm = parseInt(parts[1], 10);
      const d = new Date();
      d.setHours(hh);
      d.setMinutes(mm);
      d.setSeconds(0);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };

  function validate() {
    const nextErrors = {};

    if (!fromLoc.trim()) {
      nextErrors.fromLoc = 'Origin location is required';
    } else if (fromLoc.trim().length > 50) {
      nextErrors.fromLoc = 'Origin cannot exceed 50 characters';
    }

    if (!toLoc.trim()) {
      nextErrors.toLoc = 'Destination location is required';
    } else if (toLoc.trim().length > 50) {
      nextErrors.toLoc = 'Destination cannot exceed 50 characters';
    }

    if (!date.trim()) {
      nextErrors.date = 'Travel date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      nextErrors.date = 'Format must be YYYY-MM-DD (e.g. 2026-03-15)';
    }

    if (!time.trim()) {
      nextErrors.time = 'Departure time is required';
    } else if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time.trim())) {
      nextErrors.time = 'Format must be HH:MM (e.g. 14:30)';
    }

    const seatsNum = parseInt(seatsAvbl, 10);
    if (!seatsAvbl.trim() || isNaN(seatsNum) || seatsNum < 1 || seatsNum > 20) {
      nextErrors.seatsAvbl = 'Seats must be between 1 and 20';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (loading) return;
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const formattedTime = time.trim().length === 5 ? `${time.trim()}:00` : time.trim();

      await postRide({
        from_loc: fromLoc.trim(),
        to_loc: toLoc.trim(),
        travel_date: date.trim(),
        dep_time: formattedTime,
        seats_avbl: parseInt(seatsAvbl, 10),
        notes: notes.trim() || undefined,
      });

      if (Platform.OS === 'web') {
        window.alert('Your ride has been posted!');
        navigation.goBack();
      } else {
        Alert.alert('Success', 'Your ride has been posted!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not post ride. Please try again.');
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

              {/* Side-by-Side Date & Time Controls */}
              <View style={styles.row}>
                <View style={styles.halfCol}>
                  <Text style={styles.fieldLabel}>Travel Date *</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                      }}
                      style={{
                        height: 44,
                        padding: '0 12px',
                        borderRadius: 8,
                        border: `1px solid ${errors.date ? colors.destructive : '#e2ddd5'}`,
                        backgroundColor: '#f7f5f2',
                        color: colors.foreground,
                        fontSize: 14,
                        fontFamily: 'inherit',
                        outline: 'none',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                      aria-label="Travel Date"
                    />
                  ) : (
                    <Pressable
                      onPress={() => setShowDatePicker(true)}
                      style={[
                        styles.pickerButton,
                        !!errors.date && styles.pickerButtonError,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Select travel date, currently ${date || 'not set'}`}
                    >
                      <Text style={[styles.pickerValueText, !date && styles.placeholderText]}>
                        {date || 'Select date'}
                      </Text>
                      <Text style={styles.pickerIcon}>📅</Text>
                    </Pressable>
                  )}
                  {errors.date ? <Text style={styles.fieldErrorText}>{errors.date}</Text> : null}
                </View>

                <View style={styles.halfCol}>
                  <Text style={styles.fieldLabel}>Departure *</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => {
                        setTime(e.target.value);
                        if (errors.time) setErrors((prev) => ({ ...prev, time: '' }));
                      }}
                      style={{
                        height: 44,
                        padding: '0 12px',
                        borderRadius: 8,
                        border: `1px solid ${errors.time ? colors.destructive : '#e2ddd5'}`,
                        backgroundColor: '#f7f5f2',
                        color: colors.foreground,
                        fontSize: 14,
                        fontFamily: 'inherit',
                        outline: 'none',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                      aria-label="Departure Time"
                    />
                  ) : (
                    <Pressable
                      onPress={() => setShowTimePicker(true)}
                      style={[
                        styles.pickerButton,
                        !!errors.time && styles.pickerButtonError,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Select departure time, currently ${time || 'not set'}`}
                    >
                      <Text style={[styles.pickerValueText, !time && styles.placeholderText]}>
                        {time || 'Select time'}
                      </Text>
                      <Text style={styles.pickerIcon}>🕒</Text>
                    </Pressable>
                  )}
                  {errors.time ? <Text style={styles.fieldErrorText}>{errors.time}</Text> : null}
                </View>
              </View>

              {/* Available Seats - Clean full-width field */}
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
                  label="Post Ride"
                  tone="primary"
                  loading={loading}
                  loadingLabel="Posting..."
                  onPress={handleSubmit}
                />
              </View>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Native Android Date Picker */}
        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={getDateValue()}
            mode="date"
            display="default"
            onChange={onAndroidDateChange}
          />
        )}

        {/* Native Android Time Picker */}
        {showTimePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={getTimeValue()}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={onAndroidTimeChange}
          />
        )}

        {/* iOS Date Picker Modal */}
        {showDatePicker && Platform.OS === 'ios' && (
          <Modal
            transparent
            animationType="slide"
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setShowDatePicker(false)}
            >
              <View
                style={styles.iosPickerContainer}
                onStartShouldSetResponder={() => true}
              >
                <View style={styles.iosPickerHeader}>
                  <Text style={styles.iosPickerTitle}>Select Travel Date</Text>
                  <Pressable
                    onPress={handleDoneDatePicker}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Done"
                  >
                    <Text style={styles.iosPickerDoneText}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={getDateValue()}
                  mode="date"
                  display="spinner"
                  themeVariant="light"
                  textColor={colors.foreground}
                  onChange={onIOSDateChange}
                  style={styles.iosPicker}
                />
              </View>
            </Pressable>
          </Modal>
        )}

        {/* iOS Time Picker Modal */}
        {showTimePicker && Platform.OS === 'ios' && (
          <Modal
            transparent
            animationType="slide"
            visible={showTimePicker}
            onRequestClose={() => setShowTimePicker(false)}
          >
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setShowTimePicker(false)}
            >
              <View
                style={styles.iosPickerContainer}
                onStartShouldSetResponder={() => true}
              >
                <View style={styles.iosPickerHeader}>
                  <Text style={styles.iosPickerTitle}>Select Departure Time</Text>
                  <Pressable
                    onPress={handleDoneTimePicker}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Done"
                  >
                    <Text style={styles.iosPickerDoneText}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={getTimeValue()}
                  mode="time"
                  is24Hour={true}
                  display="spinner"
                  themeVariant="light"
                  textColor={colors.foreground}
                  onChange={onIOSTimeChange}
                  style={styles.iosPicker}
                />
              </View>
            </Pressable>
          </Modal>
        )}
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
  fieldLabel: {
    ...typography.label,
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 6,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f7f5f2',
    borderWidth: 1,
    borderColor: '#e2ddd5',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  pickerButtonError: {
    borderColor: colors.destructive,
  },
  pickerValueText: {
    ...typography.body,
    fontSize: 14,
    color: colors.foreground,
    fontWeight: '500',
  },
  placeholderText: {
    color: '#999388',
    fontWeight: '400',
  },
  pickerIcon: {
    fontSize: 16,
  },
  fieldErrorText: {
    ...typography.caption,
    color: colors.destructive,
    marginTop: 4,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  halfCol: {
    flex: 1,
  },
  submitContainer: {
    marginTop: spacing.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  iosPickerContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xs,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iosPickerTitle: {
    ...typography.subheading,
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  iosPickerDoneText: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  iosPicker: {
    height: 200,
  },
});
