import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import AppHeader from '../components/AppHeader';
import AppShell from '../components/AppShell';
import Card from '../components/Card';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../constants/colors';
import { radius, spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { useAuth } from '../context/AuthContext';
import {
  getUserProfile,
  listMyRequests,
  listMyRides,
  updateUserProfile,
} from '../features/rides/services/rides';
import { formatFullName } from '../utils/format';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [myRides, setMyRides] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRides, setLoadingRides] = useState(true);

  // Phone editing state
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  const currentUserId = user?.user_id ?? user?.id;

  const loadData = useCallback(async () => {
    setLoadingRides(true);
    try {
      const promises = [listMyRides(), listMyRequests()];
      if (currentUserId) {
        promises.push(getUserProfile(currentUserId));
      }
      const [ridesData, reqsData, profile] = await Promise.all(promises);
      setMyRides(Array.isArray(ridesData) ? ridesData : []);
      setMyRequests(Array.isArray(reqsData) ? reqsData : []);
      if (profile) {
        setProfileData(profile);
      }
    } catch {} finally {
      setLoadingRides(false);
    }
  }, [currentUserId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const rawName = profileData?.name || user?.name || user?.roll_no || 'Campus User';
  const fullName = formatFullName(rawName) || rawName;
  const email =
    profileData?.email_id ||
    user?.email_id ||
    (user?.roll_no ? `${user.roll_no}@iiitkottayam.ac.in` : 'Not available');
  const currentPhone = profileData?.phone_no || user?.phone_no || 'Not available';

  function handleStartEdit() {
    setPhoneInput(profileData?.phone_no || user?.phone_no || '');
    setPhoneError('');
    setIsEditingPhone(true);
  }

  function handleCancelEdit() {
    setPhoneInput(profileData?.phone_no || user?.phone_no || '');
    setPhoneError('');
    setIsEditingPhone(false);
  }

  function validatePhone(val) {
    const trimmed = val.trim();
    if (!trimmed) {
      return 'Phone number cannot be empty';
    }
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      return 'Please enter a valid phone number (7-15 digits)';
    }
    return '';
  }

  async function handleSavePhone() {
    if (isSavingPhone) return;
    const err = validatePhone(phoneInput);
    if (err) {
      setPhoneError(err);
      return;
    }
    setPhoneError('');
    setIsSavingPhone(true);
    try {
      const updated = await updateUserProfile({ phone_no: phoneInput.trim() });
      setProfileData(updated);
      setIsEditingPhone(false);
    } catch (saveErr) {
      setPhoneError(saveErr.message || 'Failed to save phone number');
    } finally {
      setIsSavingPhone(false);
    }
  }

  return (
    <AppShell>
      <View style={styles.screen}>
        <AppHeader
          title="Profile"
          subtitle="Your campus account & activity"
          onBack={() => navigation.goBack()}
        />

        <ScrollView contentContainerStyle={styles.body}>
          {/* SECTION 1: MY PROFILE */}
          <Card padding="lg" style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardKicker}>MY PROFILE</Text>
              {user?.roll_no ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{user.roll_no}</Text>
                </View>
              ) : null}
            </View>

            {/* Read-Only Full Name */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <Text style={styles.fieldValue}>{fullName}</Text>
            </View>

            <View style={styles.divider} />

            {/* Editable Phone / Contact */}
            <View style={styles.fieldSection}>
              {isEditingPhone ? (
                <View style={styles.editSection}>
                  <Text style={styles.fieldLabel}>Phone / Contact</Text>
                  <FormInput
                    value={phoneInput}
                    onChangeText={(text) => {
                      setPhoneInput(text);
                      if (phoneError) setPhoneError('');
                    }}
                    placeholder="Enter phone number (e.g. 9876543210)"
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    error={phoneError}
                    editable={!isSavingPhone}
                    style={styles.phoneInput}
                  />
                  <View style={styles.editActions}>
                    <Pressable
                      onPress={handleCancelEdit}
                      disabled={isSavingPhone}
                      style={styles.cancelButton}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel editing phone number"
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>

                    <Pressable
                      onPress={handleSavePhone}
                      disabled={isSavingPhone}
                      style={[styles.saveButton, isSavingPhone && styles.saveButtonDisabled]}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Save phone number"
                    >
                      {isSavingPhone ? (
                        <View style={styles.savingRow}>
                          <ActivityIndicator size="small" color={colors.white} style={styles.savingSpinner} />
                          <Text style={styles.saveButtonText}>Saving...</Text>
                        </View>
                      ) : (
                        <Text style={styles.saveButtonText}>Save</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.fieldHeaderRow}>
                    <Text style={styles.fieldLabel}>Phone / Contact</Text>
                    <Pressable
                      onPress={handleStartEdit}
                      style={styles.editTrigger}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Edit phone number"
                    >
                      <Text style={styles.editTriggerText}>Edit</Text>
                    </Pressable>
                  </View>
                  <Text
                    style={[
                      styles.fieldValue,
                      currentPhone === 'Not available' && styles.mutedValue,
                    ]}
                  >
                    {currentPhone}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Read-Only Email Address */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <Text style={styles.fieldValue}>{email}</Text>
            </View>
          </Card>

          {/* SECTION 2: MY CAB RIDES */}
          <Card padding="lg" style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardKicker}>MY CAB RIDES</Text>
              {myRides.length > 0 ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{myRides.length}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.sectionDesc}>
              {myRides.length > 0
                ? `You have ${myRides.length} active posted ride${myRides.length === 1 ? '' : 's'}. Manage riders, seat requests, or cancel rides.`
                : "You haven't posted any rides yet. Create a ride to share travel with campus peers."}
            </Text>
            <View style={styles.actionRow}>
              <PrimaryButton
                label="Manage"
                tone="outline"
                onPress={() => navigation.navigate('MyRides', { initialTab: 'posted' })}
              />
            </View>
          </Card>

          {/* SECTION 3: MY REQUESTS */}
          <Card padding="lg" style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardKicker}>MY REQUESTS</Text>
              {myRequests.length > 0 ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{myRequests.length}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.sectionDesc}>
              {myRequests.length > 0
                ? `You have ${myRequests.length} ride request${myRequests.length === 1 ? '' : 's'}. Track request status or cancel pending requests.`
                : "You haven't requested to join any rides yet. Browse available rides to travel together."}
            </Text>
            <View style={styles.actionRow}>
              <PrimaryButton
                label="Manage"
                tone="outline"
                onPress={() => navigation.navigate('MyRides', { initialTab: 'requests' })}
              />
            </View>
          </Card>

          {/* SECTION 3: MY ITEMS */}
          <Card padding="lg" style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardKicker}>MY ITEMS</Text>
            </View>
            <Text style={styles.sectionDesc}>
              Manage your lost & found listings, update status, or resolve claims.
            </Text>
            <View style={styles.actionRow}>
              <PrimaryButton
                label="View My Items"
                tone="outline"
                onPress={() => navigation.navigate('MyItems')}
              />
            </View>
          </Card>

          {/* SECTION 4: MY HACKMATE */}
          <Card padding="lg" style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardKicker}>MY HACKMATE</Text>
            </View>
            <Text style={styles.sectionDesc}>
              Manage your hackathon candidate profile, created teams, and membership requests.
            </Text>
            <View style={styles.actionRow}>
              <PrimaryButton
                label="View HackMate"
                tone="outline"
                onPress={() => navigation.navigate('HackFindHub')}
              />
            </View>
          </Card>

          {/* LOGOUT */}
          <View style={styles.logoutWrap}>
            <PrimaryButton label="Logout" tone="destructive" onPress={logout} />
          </View>
        </ScrollView>
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
    padding: spacing.lg,
  },
  userCard: {
    marginBottom: spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  badge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.foreground,
  },
  fieldSection: {
    marginVertical: 2,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginBottom: 4,
  },
  fieldValue: {
    ...typography.subheading,
    color: colors.foreground,
  },
  mutedValue: {
    color: colors.mutedForeground,
  },
  editTrigger: {
    minHeight: 36,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  editTriggerText: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '600',
  },
  editSection: {
    marginTop: 2,
  },
  phoneInput: {
    marginBottom: 0,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelButton: {
    minHeight: 44,
    minWidth: 64,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    ...typography.label,
    color: colors.foreground,
    fontWeight: '500',
  },
  saveButton: {
    minHeight: 44,
    minWidth: 64,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.label,
    color: colors.white,
    fontWeight: '600',
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingSpinner: {
    marginRight: 6,
  },
  sectionCard: {
    marginBottom: spacing.lg,
  },
  sectionDesc: {
    ...typography.body,
    color: colors.mutedForeground,
    marginBottom: spacing.md,
  },
  actionRow: {
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  logoutWrap: {
    marginTop: spacing.xs,
  },
  countBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countBadgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.foreground,
  },
});
