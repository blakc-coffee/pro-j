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
import { handleEmailPress, handlePhonePress } from '../utils/contact';

import ThemeToggle from '../components/ThemeToggle';

function extractNameTokens(raw) {
  if (!raw) return [];
  let clean = String(raw).trim();
  const rollMatch = clean.match(/^([0-9a-zA-Z]{10,12})\s+(.+)$/i);
  if (rollMatch) {
    clean = rollMatch[2].trim();
  }
  return clean
    .split(/\s+/)
    .map((t) => t.replace(/[.,;:]/g, '').trim())
    .filter(Boolean)
    .map((t) => (t.length === 1 ? t.toUpperCase() : t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()));
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout, updateUser } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [myRides, setMyRides] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRides, setLoadingRides] = useState(true);

  // Display Name customization state
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState([]);
  const [nameError, setNameError] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

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
  const legalFullNameRaw = profileData?.full_name || user?.full_name || profileData?.name || user?.name || '';
  const legalFullNameFormatted = formatFullName(legalFullNameRaw) || fullName;
  const availableTokens = extractNameTokens(legalFullNameRaw);
  const currentDisplayName = formatFullName(profileData?.name || user?.name || rawName) || rawName;

  const email =
    profileData?.email_id ||
    user?.email_id ||
    (user?.roll_no ? `${user.roll_no}@iiitkottayam.ac.in` : 'Not available');
  const currentPhone = profileData?.phone_no || user?.phone_no || 'Not available';

  function handleStartEditName() {
    setNameError('');
    const currentNameStr = profileData?.name || user?.name || '';
    const currentTokens = extractNameTokens(currentNameStr).map((t) => t.toLowerCase());

    const initialIndices = [];
    availableTokens.forEach((tok, idx) => {
      if (currentTokens.includes(tok.toLowerCase())) {
        initialIndices.push(idx);
      }
    });

    if (initialIndices.length === 0) {
      setSelectedTokens(availableTokens.map((_, i) => i));
    } else {
      setSelectedTokens(initialIndices);
    }
    setIsEditingName(true);
  }

  function handleCancelEditName() {
    setIsEditingName(false);
    setNameError('');
  }

  function toggleToken(index) {
    let next;
    if (selectedTokens.includes(index)) {
      next = selectedTokens.filter((i) => i !== index);
    } else {
      next = [...selectedTokens, index].sort((a, b) => a - b);
    }
    setSelectedTokens(next);

    if (next.length === 0) {
      setNameError('Select at least one name part to display');
      return;
    }

    const chosenParts = next.map((i) => availableTokens[i]);
    const hasFullName = chosenParts.some((p) => p.length > 1);
    if (!hasFullName) {
      setNameError('An initial cannot be your sole display name. Select at least one full name.');
      return;
    }

    setNameError('');
  }

  const previewName = selectedTokens.map((i) => availableTokens[i]).join(' ');

  async function handleSaveName() {
    if (isSavingName) return;
    if (selectedTokens.length === 0) {
      setNameError('Select at least one name part to display');
      return;
    }
    const chosenParts = selectedTokens.map((i) => availableTokens[i]);
    const hasFullName = chosenParts.some((p) => p.length > 1);
    if (!hasFullName) {
      setNameError('An initial cannot be your sole display name. Select at least one full name.');
      return;
    }

    setNameError('');
    setIsSavingName(true);
    try {
      const updated = await updateUserProfile({ name: previewName });
      setProfileData(updated);
      if (updateUser) {
        await updateUser({ name: updated.name, full_name: updated.full_name || legalFullNameRaw });
      }
      setIsEditingName(false);
    } catch (saveErr) {
      setNameError(saveErr.message || 'Failed to update display name');
    } finally {
      setIsSavingName(false);
    }
  }

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
      if (updateUser) {
        await updateUser({ phone_no: updated.phone_no });
      }
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
          rightAction={<ThemeToggle />}
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

            {/* Display Name with Customizer */}
            <View style={styles.fieldSection}>
              {isEditingName ? (
                <View style={styles.editSection}>
                  <View style={styles.fieldHeaderRow}>
                    <Text style={styles.fieldLabel}>Display Name</Text>
                  </View>
                  <Text style={styles.helperText}>
                    Your record name will be <Text style={styles.boldSubtext}>{legalFullNameFormatted}</Text>. Select which parts to display:
                  </Text>
                  
                  <View style={styles.tokenChipsRow}>
                    {availableTokens.map((token, index) => {
                      const isSelected = selectedTokens.includes(index);
                      return (
                        <Pressable
                          key={`${token}-${index}`}
                          onPress={() => toggleToken(index)}
                          style={[
                            styles.tokenChip,
                            isSelected && styles.tokenChipSelected,
                          ]}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: isSelected }}
                          accessibilityLabel={`Toggle ${token}`}
                        >
                          <Text
                            style={[
                              styles.tokenChipText,
                              isSelected && styles.tokenChipTextSelected,
                            ]}
                          >
                            {token}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.previewBox}>
                    <Text style={styles.previewLabel}>Public Preview</Text>
                    <Text style={styles.previewValue}>
                      {previewName || '(No name selected)'}
                    </Text>
                  </View>

                  {nameError ? (
                    <Text style={styles.errorText}>{nameError}</Text>
                  ) : null}

                  <View style={styles.editActions}>
                    <Pressable
                      onPress={handleCancelEditName}
                      disabled={isSavingName}
                      style={styles.cancelButton}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel editing display name"
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>

                    <Pressable
                      onPress={handleSaveName}
                      disabled={isSavingName || !!nameError || selectedTokens.length === 0}
                      style={[
                        styles.saveButton,
                        (isSavingName || !!nameError || selectedTokens.length === 0) &&
                          styles.saveButtonDisabled,
                      ]}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Save display name"
                    >
                      {isSavingName ? (
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
                    <Text style={styles.fieldLabel}>Display Name</Text>
                    {availableTokens.length > 1 ? (
                      <Pressable
                        onPress={handleStartEditName}
                        style={styles.editTrigger}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Customize display name"
                      >
                        <Text style={styles.editTriggerText}>Customize</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <Text style={styles.fieldValue}>{currentDisplayName}</Text>
                </View>
              )}
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
                    placeholder="Enter phone number (9876543210)"
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
                  <Pressable
                    onPress={() => currentPhone !== 'Not available' && handlePhonePress(currentPhone)}
                    disabled={currentPhone === 'Not available'}
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${currentPhone}`}
                  >
                    <Text
                      style={[
                        styles.fieldValue,
                        currentPhone === 'Not available' && styles.mutedValue,
                        currentPhone !== 'Not available' && styles.clickableValue,
                      ]}
                    >
                      {currentPhone}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Read-Only Email Address */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <Pressable
                onPress={() => email !== 'Not available' && handleEmailPress(email)}
                disabled={email === 'Not available'}
                accessibilityRole="button"
                accessibilityLabel={`Email ${email}`}
              >
                <Text
                  style={[
                    styles.fieldValue,
                    email === 'Not available' && styles.mutedValue,
                    email !== 'Not available' && styles.clickableValue,
                  ]}
                >
                  {email}
                </Text>
              </Pressable>
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
  clickableValue: {
    color: colors.primary,
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
  legalNameSubtext: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  boldSubtext: {
    fontWeight: '600',
    color: colors.foreground,
  },
  helperText: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
  tokenChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  tokenChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '18',
  },
  tokenChipText: {
    ...typography.label,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  tokenChipTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  previewBox: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
    borderRadius: 8,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewLabel: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginBottom: 2,
  },
  previewValue: {
    ...typography.subheading,
    fontWeight: '600',
    color: colors.foreground,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: 4,
    fontWeight: '500',
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
