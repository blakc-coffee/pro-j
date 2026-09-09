import { useCallback, useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

import AppHeader from '../../../components/AppHeader';
import AppShell from '../../../components/AppShell';
import Card from '../../../components/Card';
import FormInput from '../../../components/FormInput';
import PrimaryButton from '../../../components/PrimaryButton';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import { getItem, reportItem, updateItem } from '../services/lostfound';

const TYPE_OPTIONS = [
  { label: 'Lost', value: 'lost' },
  { label: 'Found', value: 'found' },
];

const CATEGORY_OPTIONS = [
  'Electronics',
  'Cards & IDs',
  'Keys',
  'Clothing',
  'Books',
  'Other',
];

function formatDisplayDate(dateObj) {
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}

function parseYMDToDate(ymdString) {
  if (!ymdString) return new Date();
  const parts = ymdString.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const parsed = new Date(y, m, d);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function formatDateToYMD(dateObj) {
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function ReportItemScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const itemId = route.params?.itemId;
  const isEditing = !!itemId;

  // Form State
  const [type, setType] = useState('lost');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [location, setLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [image, setImage] = useState(null);
  const [showImageMenu, setShowImageMenu] = useState(false);

  // UI / Error State
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // Load existing item data when editing
  const loadExistingItem = useCallback(async () => {
    if (!itemId) return;
    setInitialLoading(true);
    setServerError('');
    try {
      const existing = await getItem(itemId);
      if (existing) {
        setType(existing.type || 'lost');
        setTitle(existing.title || '');
        setCategory(existing.category || 'Electronics');
        setLocation(existing.location || '');
        const dateStr = existing.item_date || existing.itemDate || '';
        if (dateStr) {
          setSelectedDate(parseYMDToDate(dateStr));
        }
        setDescription(existing.description || '');
        setContactInfo(existing.contact_info || existing.contactInfo || '');
        const existingImg = existing.image_url || existing.imageUrl || null;
        setImage(existingImg);
      }
    } catch (err) {
      setServerError(err.message || 'Failed to load existing item for editing.');
    } finally {
      setInitialLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    if (isEditing) {
      loadExistingItem();
    }
  }, [isEditing, loadExistingItem]);

  // Date Picker Handlers
  const handleAndroidDateChange = (event, date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && date) {
      setSelectedDate(date);
      if (errors.itemDate) {
        setErrors((prev) => ({ ...prev, itemDate: null }));
      }
    }
  };

  const handleIOSDateChange = (event, date) => {
    if (date) {
      setSelectedDate(date);
      if (errors.itemDate) {
        setErrors((prev) => ({ ...prev, itemDate: null }));
      }
    }
  };

  const handleWebDateInput = (text) => {
    if (text) {
      const parsed = parseYMDToDate(text);
      setSelectedDate(parsed);
      if (errors.itemDate) {
        setErrors((prev) => ({ ...prev, itemDate: null }));
      }
    }
  };

  // Image Selection Handlers (Single dropdown/menu control)
  const openImagePickerMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Choose from Gallery', 'Take a Photo'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handlePickFromGallery();
          } else if (buttonIndex === 2) {
            handleTakePhoto();
          }
        }
      );
    } else {
      setShowImageMenu((prev) => !prev);
    }
  };

  const handlePickFromGallery = async () => {
    setShowImageMenu(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow photo library access to select an image.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const formattedUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setImage(formattedUri);
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to open image library. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    setShowImageMenu(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow camera access to take a photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const formattedUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setImage(formattedUri);
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to open camera. Please try again.');
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setShowImageMenu(false);
  };

  const validate = () => {
    const nextErrors = {};
    setServerError('');

    if (!title.trim()) {
      nextErrors.title = 'Item name is required';
    }

    if (!location.trim()) {
      nextErrors.location = 'Location is required';
    }

    if (!selectedDate || isNaN(selectedDate.getTime())) {
      nextErrors.itemDate = 'Valid date is required';
    }

    if (!type || (type !== 'lost' && type !== 'found')) {
      nextErrors.type = 'Type must be Lost or Found';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setServerError('');

    try {
      const formattedDateYMD = formatDateToYMD(selectedDate);

      const payload = {
        title: title.trim(),
        type: type.toLowerCase(),
        category: category,
        location: location.trim(),
        item_date: formattedDateYMD,
        description: description.trim() || undefined,
        contact_info: contactInfo.trim() || undefined,
        image_url: image || undefined,
      };

      if (isEditing) {
        await updateItem(itemId, payload);
      } else {
        await reportItem(payload);
      }

      if (Platform.OS === 'web') {
        navigation.goBack();
      } else {
        Alert.alert(
          'Success',
          isEditing
            ? 'Your listing has been updated!'
            : 'Your item report has been published!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (err) {
      setServerError(err.message || 'Failed to submit item. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const dateLabel = type === 'lost' ? 'Date Lost *' : 'Date Found *';
  const ymdValue = formatDateToYMD(selectedDate);
  const displayDateStr = formatDisplayDate(selectedDate);

  return (
    <AppShell>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <AppHeader
          title={isEditing ? 'Edit Item' : 'Report Item'}
          subtitle={
            isEditing
              ? 'Update your lost & found report details'
              : 'Post details of a lost or found item on campus'
          }
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {serverError ? (
            <View style={styles.serverErrorBanner} accessibilityRole="alert">
              <Text style={styles.serverErrorText}>{serverError}</Text>
            </View>
          ) : null}

          {/* 1. Item Type Selector (Neutral border & background, NO RED/GREEN BORDERS) */}
          <Card padding="lg" style={styles.sectionCard}>
            <Text style={styles.fieldLabel}>Type of Report *</Text>
            <View style={styles.typeSegmentContainer}>
              {TYPE_OPTIONS.map((opt) => {
                const active = type === opt.value;
                const isLost = opt.value === 'lost';
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setType(opt.value)}
                    style={[
                      styles.typeSegment,
                      active && styles.typeSegmentActive,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[
                        styles.typeSegmentText,
                        active && (isLost ? styles.typeSegmentTextActiveLost : styles.typeSegmentTextActiveFound),
                      ]}
                    >
                      {opt.label.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.type ? (
              <Text style={styles.inlineError}>{errors.type}</Text>
            ) : null}
          </Card>

          {/* 2. Primary Details */}
          <Card padding="lg" style={styles.sectionCard}>
            <FormInput
              label="Item Name *"
              placeholder="e.g. Black Sony Headphones"
              value={title}
              onChangeText={setTitle}
              error={errors.title}
              autoCapitalize="words"
            />

            {/* Category Selector */}
            <View style={styles.categoryContainer}>
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.categoryWrap}>
                {CATEGORY_OPTIONS.map((cat) => {
                  const active = category === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[styles.categoryChip, active && styles.categoryChipActive]}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          active && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <FormInput
              label="Location *"
              placeholder="e.g. Central Library, 2nd Floor"
              value={location}
              onChangeText={setLocation}
              error={errors.location}
            />

            {/* Native Date Picker Input */}
            <View style={styles.dateFieldContainer}>
              <Text style={styles.fieldLabel}>{dateLabel}</Text>

              {Platform.OS === 'web' ? (
                <View style={styles.webDateWrap}>
                  <input
                    type="date"
                    value={ymdValue}
                    onChange={(e) => handleWebDateInput(e.target.value)}
                    style={{
                      width: '100%',
                      height: 44,
                      padding: '0 12px',
                      borderRadius: 8,
                      border: `1px solid ${errors.itemDate ? colors.destructive : colors.border}`,
                      backgroundColor: colors.surfaceAlt,
                      color: colors.foreground,
                      fontSize: 14,
                      fontFamily: 'inherit',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    aria-label={dateLabel}
                  />
                  <Text style={styles.fieldHint}>
                    Display: {displayDateStr} (YYYY-MM-DD format submitted)
                  </Text>
                </View>
              ) : (
                <>
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    style={[
                      styles.datePickerButton,
                      errors.itemDate && styles.datePickerButtonError,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Select date, currently ${displayDateStr}`}
                  >
                    <Text style={styles.datePickerValueText}>
                      {displayDateStr || 'Select date'}
                    </Text>
                    <Text style={styles.datePickerIcon}>📅</Text>
                  </Pressable>
                  <Text style={styles.fieldHint}>Tap to open native calendar picker</Text>

                  {/* iOS Modal with explicit Done button / Backdrop tap to dismiss */}
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
                            <Text style={styles.iosPickerTitle}>Select Date</Text>
                            <Pressable
                              onPress={() => setShowDatePicker(false)}
                              hitSlop={8}
                              accessibilityRole="button"
                              accessibilityLabel="Done"
                            >
                              <Text style={styles.iosPickerDoneText}>Done</Text>
                            </Pressable>
                          </View>
                          <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display="spinner"
                            themeVariant="light"
                            textColor={colors.foreground}
                            maximumDate={new Date()}
                            onChange={handleIOSDateChange}
                            style={styles.iosDatePicker}
                          />
                        </View>
                      </Pressable>
                    </Modal>
                  )}

                  {/* Android Auto-Dismissing Date Picker */}
                  {showDatePicker && Platform.OS === 'android' && (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display="default"
                      maximumDate={new Date()}
                      onChange={handleAndroidDateChange}
                    />
                  )}
                </>
              )}

              {errors.itemDate ? (
                <Text style={styles.inlineError}>{errors.itemDate}</Text>
              ) : null}
            </View>
          </Card>

          {/* 3. Single Image Picker Control & Preview (No Image URL) */}
          <Card padding="lg" style={styles.sectionCard}>
            <Text style={styles.fieldLabel}>Item Image (Optional)</Text>
            <Text style={styles.fieldHint}>
              Adding a photo significantly helps identify and return your item.
            </Text>

            {/* Single Add Image Button Control */}
            {!image ? (
              <Pressable
                onPress={openImagePickerMenu}
                style={styles.addImageControl}
                accessibilityRole="button"
                accessibilityLabel="Add image option menu"
              >
                <Text style={styles.addImageControlIcon}>📷</Text>
                <Text style={styles.addImageControlText}>Add Image ▼</Text>
              </Pressable>
            ) : null}

            {/* Dropdown Action Menu (for Web / Android dropdown) */}
            {showImageMenu ? (
              <View style={styles.imageMenuDropdown}>
                <Pressable
                  onPress={handlePickFromGallery}
                  style={styles.imageMenuItem}
                  accessibilityRole="button"
                >
                  <Text style={styles.imageMenuItemIcon}>🖼️</Text>
                  <Text style={styles.imageMenuItemText}>Choose from Gallery</Text>
                </Pressable>
                <View style={styles.imageMenuDivider} />
                <Pressable
                  onPress={handleTakePhoto}
                  style={styles.imageMenuItem}
                  accessibilityRole="button"
                >
                  <Text style={styles.imageMenuItemIcon}>📷</Text>
                  <Text style={styles.imageMenuItemText}>Take a Photo</Text>
                </Pressable>
                <View style={styles.imageMenuDivider} />
                <Pressable
                  onPress={() => setShowImageMenu(false)}
                  style={[styles.imageMenuItem, styles.imageMenuCancelItem]}
                  accessibilityRole="button"
                >
                  <Text style={styles.imageMenuCancelText}>Cancel</Text>
                </Pressable>
              </View>
            ) : null}

            {/* Image Preview & Actions */}
            {image ? (
              <View style={styles.previewContainer}>
                <Image
                  source={{ uri: image }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />

                <View style={styles.imageActionRow}>
                  <Pressable
                    onPress={openImagePickerMenu}
                    style={styles.changeImageButton}
                    accessibilityRole="button"
                    accessibilityLabel="Change image"
                  >
                    <Text style={styles.changeImageText}>Change Image ▼</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleRemoveImage}
                    style={styles.removeImageButton}
                    accessibilityRole="button"
                    accessibilityLabel="Remove image"
                  >
                    <Text style={styles.removeImageText}>Remove Image</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </Card>

          {/* 4. Description & Contact Info */}
          <Card padding="lg" style={styles.sectionCard}>
            <FormInput
              label="Description (Optional)"
              placeholder="Provide identifying features, brand, color, stickers, or unique marks..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <FormInput
              label="Contact Info (Optional)"
              placeholder="e.g. Phone number, campus email, room no."
              value={contactInfo}
              onChangeText={setContactInfo}
              helperText="Campus members will see this to reach out to you."
            />
          </Card>

          {/* Submit Action */}
          <View style={styles.submitContainer}>
            <PrimaryButton
              label={isEditing ? 'Save Changes' : 'Publish Item Report'}
              tone="primary"
              loading={submitting}
              loadingLabel={isEditing ? 'Saving...' : 'Submitting...'}
              disabled={submitting || initialLoading}
              onPress={handleSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.label,
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  fieldHint: {
    ...typography.caption,
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 4,
    marginBottom: spacing.xs,
  },
  typeSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  typeSegment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  // Neutral selected state: subtle elevated card surface with neutral border, ZERO RED/GREEN BORDERS
  typeSegmentActive: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typeSegmentText: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.mutedForeground,
  },
  typeSegmentTextActiveLost: {
    color: colors.destructive,
  },
  typeSegmentTextActiveFound: {
    color: colors.success,
  },
  inlineError: {
    ...typography.caption,
    color: colors.destructive,
    marginTop: 6,
  },
  categoryContainer: {
    marginBottom: spacing.md,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryChip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.foreground,
  },
  categoryChipTextActive: {
    color: colors.primaryForeground,
  },
  dateFieldContainer: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  webDateWrap: {
    marginBottom: 4,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  datePickerButtonError: {
    borderColor: colors.destructive,
  },
  datePickerValueText: {
    ...typography.body,
    fontSize: 14,
    color: colors.foreground,
    fontWeight: '500',
  },
  datePickerIcon: {
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  iosPickerContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iosPickerTitle: {
    ...typography.heading,
    fontSize: 16,
    color: colors.foreground,
  },
  iosPickerDoneText: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  iosDatePicker: {
    backgroundColor: colors.card,
  },
  // Single Add Image Control
  addImageControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  addImageControlIcon: {
    fontSize: 18,
  },
  addImageControlText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  // Image Menu Dropdown
  imageMenuDropdown: {
    marginTop: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  imageMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: 10,
  },
  imageMenuItemIcon: {
    fontSize: 18,
  },
  imageMenuItemText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  imageMenuDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  imageMenuCancelItem: {
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  imageMenuCancelText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  previewContainer: {
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surfaceAlt,
  },
  imageActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  changeImageButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  changeImageText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  removeImageButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  removeImageText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: colors.destructive,
  },
  serverErrorBanner: {
    backgroundColor: colors.destructiveSoft,
    borderWidth: 1,
    borderColor: colors.destructive,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  serverErrorText: {
    ...typography.caption,
    color: colors.destructive,
    fontWeight: '600',
  },
  submitContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
});
