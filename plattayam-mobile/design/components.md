# Plattayam Component Guidelines — `components.md`

This document defines component contracts, prop interfaces, and styling rules for both **existing components** and **proposed future primitives**.

---

## 1. Existing Active Components (`src/components/`)

These components currently exist and are used in the active codebase:

### `AppHeader` ([`src/components/AppHeader.js`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/src/components/AppHeader.js))
- **Status**: Implemented & Active.
- **Responsibility**: Standard top header bar with safe-area insets, back button, title/subtitle, and right action.
- **Props**: `title` (string), `subtitle` (string), `onBack` (fn), `actionLabel` (string), `onAction` (fn).

### `RideCard` ([`src/components/RideCard.js`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/src/components/RideCard.js))
- **Status**: Implemented & Active (Cab module specific).
- **Responsibility**: Card displaying route (`From → To`), `StatusBadge`, travel date, departure time, and remaining seats count.
- **Props**: `ride` (object), `footer` (ReactNode).

### `RequestRow` ([`src/components/RequestRow.js`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/src/components/RequestRow.js))
- **Status**: Implemented & Active.
- **Responsibility**: Row displaying join request user info, status badge, press to view user details modal, and Accept/Reject buttons.
- **Props**: `request`, `profile`, `showActions`, `busy`, `onAccept`, `onReject`, `onPressUser`.

### `StatusBadge` ([`src/components/StatusBadge.js`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/src/components/StatusBadge.js))
- **Status**: Implemented & Active.
- **Responsibility**: Pill badge displaying status label with variant background/text colors (`open`, `full`, `pending`, `accepted`, `rejected`, `neutral`).
- **Props**: `status` (string), `label` (string).

### `ScreenState` ([`src/components/ScreenState.js`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/src/components/ScreenState.js))
- **Status**: Implemented & Active.
- **Responsibility**: Screen state wrapper handling loading spinner (`ActivityIndicator`), error message card, and empty feed states.
- **Props**: `loading` (boolean), `error` (string), `empty` (boolean), `emptyMessage` (string), `children`.

### `ComingSoon` ([`src/components/ComingSoon.js`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/src/components/ComingSoon.js))
- **Status**: Implemented & Active.
- **Responsibility**: Placeholder card used on unreleased module tabs (`LostFoundScreen`, `TeamFinderScreen`).
- **Props**: `title` (string), `description` (string).

### `PrimaryButton` ([`src/components/PrimaryButton.js`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/src/components/PrimaryButton.js))
- **Status**: Implemented & Active.
- **Responsibility**: Action button with tone variants (`primary`, `accent`, `destructive`), loading indicator, and disabled states.
- **Props**: `label` (string), `onPress` (fn), `disabled` (boolean), `loading` (boolean), `tone` ('primary' | 'accent' | 'destructive').

### `UserProfileModal` ([`src/components/UserProfileModal.js`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/src/components/UserProfileModal.js))
- **Status**: Implemented & Active.
- **Responsibility**: Modal dialog displaying user profile info (Name, Roll No, Gender, Phone, Email) with Accept/Reject actions for requests.
- **Props**: `visible`, `userId`, `request`, `profile`, `loading`, `onClose`, `onAccept`, `onReject`, `busy`.

---

## 2. Proposed Future Primitives (Design Contracts Only)

> [!NOTE]
> The following components are **proposed design specifications** to unify duplicated UI logic before Phase 2. They do NOT exist in code yet. Do not implement them until Phase 2 primitive refactoring begins.

### `Card` (`[PROPOSED]`)
- **Intended Contract**: Reusable container shell with `colors.card` background, `radius.lg` rounded corners, and `colors.border` border line.
- **Props Interface**:
  ```typescript
  interface CardProps {
    children: React.ReactNode;
    onPress?: () => void;
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  }
  ```

### `FormInput` (`[PROPOSED]`)
- **Intended Contract**: Form field component wrapping `TextInput` with label, helper text, inline error text, and focus ring styling.
- **Props Interface**:
  ```typescript
  interface FormInputProps {
    label?: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    error?: string;
    secureTextEntry?: boolean;
    editable?: boolean;
    keyboardType?: KeyboardTypeOptions;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  }
  ```

### `Chip` (`[PROPOSED]`)
- **Intended Contract**: Generic pill tag component extending `StatusBadge` to support filter chips (`All`, `Open`, `Full`) and skill/category tags.

### `ModalShell` (`[PROPOSED]`)
- **Intended Contract**: Generic modal backdrop and container shell extracting common overlay logic from `UserProfileModal`.
