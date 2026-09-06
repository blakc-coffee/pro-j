# Plattayam Design Patterns & Interface Guidelines — `patterns.md`

This document defines interaction standards, layout patterns, accessibility rules, and state handling guidelines for Plattayam.

---

## 1. Feed & Filter Layout Pattern

Feed screens (`CabsScreen`, `LostFoundScreen`, `TeamFinderScreen`) must follow this canonical React Native layout:

```text
Screen View (flex: 1, backgroundColor: colors.background)
 ├── AppHeader (title, subtitle, optional action button)
 ├── Controls View (paddingHorizontal: spacing.lg)
 │     ├── TextInput / FormInput (Search field)
 │     └── View (flexDirection: 'row', gap: spacing.sm) -> Filter Chips (Pressable)
 ├── ScreenState Container (loading, error, empty)
 │     └── FlatList (contentContainerStyle: { paddingBottom: 96 })
 └── Floating Action Button (FAB) (position: 'absolute', bottom: spacing.lg, left: spacing.lg, right: spacing.lg)
```

---

## 2. Form Layout, Keyboard & Input Guidelines

All creation screens (`PostRideScreen`, `ReportItemScreen`, `PostTeamScreen`) must adhere to:
- **Keyboard Avoidance**: `KeyboardAvoidingView` with `behavior={Platform.OS === 'ios' ? 'padding' : undefined}`.
- **Scroll & Taps**: `ScrollView` with `keyboardShouldPersistTaps="handled"`.
- **Field Labels & Input Types**:
  - Every input must be preceded by an explicit label (`<Text style={styles.label}>`).
  - Use appropriate input options (`keyboardType="email-address"`, `autoCapitalize="none"` for roll number/email; `secureTextEntry` for passwords).
- **Date & Time Pickers**: Use `@react-native-community/datetimepicker` wrapped in a pressable input container (`pointerEvents="none"`).
- **Steppers**: Seat / member capacity controls must use `44x44px` minimum pressable stepper buttons (`PrimaryButton` or `Pressable` with `minHeight: 44`).

---

## 3. Web Interface & Accessibility Quality Guidelines

### Interaction & Touch Targets
- **Hit Targets**: All interactive elements (`Pressable`, buttons, chips) must have a minimum touch target height of `44px` or specify `hitSlop={8}`.
- **Focus Ring & Outline**: Interactive fields on web must render a visible focus ring (`borderColor: colors.ring`, `borderWidth: 2`).
- **Accessibility Attributes**: Screen reader support via `accessibilityLabel`, `accessibilityRole="button"`, and `accessibilityState`.

### Feedback & Error Messages
- **Inline Field Errors**: Display validation errors directly below the affected input in `colors.destructive`.
- **Screen-level Error Cards**: Display retryable error banners (`colors.destructiveSoft` background, `colors.destructive` border) with tap-to-retry handlers.
- **Non-blocking Toasts**: Prefer non-blocking toast banner announcements over native blocking `Alert.alert` dialogs for action confirmations.

---

## 4. Layout & Web Viewport Responsiveness

- **Safe Areas**: Top header inset handling via `react-native-safe-area-context` (`useSafeAreaInsets()`).
- **Web Desktop Container**: On `react-native-web` desktop browser viewports, screen content must be constrained to `maxWidth: 600px` and centered (`alignSelf: 'center'`, `width: '100%'`).
- **Resilient Content Wrapping**: Text components displaying user-generated input (locations, names, titles) must specify `flexWrap: 'wrap'` or `numberOfLines` to prevent text overflowing container bounds.
