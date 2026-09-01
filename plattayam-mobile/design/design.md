# Plattayam Design System — `design.md`

## Overview & Architecture

This document defines the official design system for **Plattayam**.

### Architecture & Source of Truth
- **Framework Stack**: React Native (`v0.86.2`) with Expo (SDK `~57.0.16`) and `react-native-web` (`^0.21.2`) for web browser support.
- **Styling Method**: React Native `StyleSheet.create()` referencing token constants.
- **Canonical Design Token Files**:
  - [`src/constants/colors.js`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/src/constants/colors.js)
  - [`src/constants/spacing.js`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/src/constants/spacing.js)
  - [`src/constants/typography.js`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/src/constants/typography.js)
- **Token Hierarchy**:
  ```text
  Design Documentation (design.md)
          ↓
  JS Token Constants (colors.js, spacing.js, typography.js)
          ↓
  React Native Component Stylesheets (StyleSheet.create)
          ↓
  Rendered UI (Expo Mobile & Web)
  ```

---

## Visual Theme & Palette

Plattayam uses a **campus-casual, warm paper aesthetic**:
- **Canvas**: Warm paper cream (`#dcd7c9` light, `#2c3639` dark).
- **Cards**: Soft neutral cream (`#e8e4da` light, `#354044` dark).
- **Primary**: Deep slate (`#3f4e4f` light, `#6d8683` dark).
- **Accent**: Terracotta / bronze (`#a27b5c` light, `#c09675` dark).
- **Success**: Sage green (`#4f6f52` light, `#7fa382` dark).
- **Warning**: Muted amber (`#b07d3c` light, `#d3a15f` dark).
- **Destructive**: Muted rust red (`#a34f43` light, `#cf7c6d` dark).

---

## Canonical Color Tokens ([`colors.js`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/src/constants/colors.js))

### Light Mode (Primary Theme)

| Token Name | Hex Code | Purpose & Usage |
| :--- | :--- | :--- |
| `background` | `#dcd7c9` | Main screen background canvas |
| `card` | `#e8e4da` | Card surfaces, container cards, form inputs |
| `foreground` | `#2c3639` | Primary text color |
| `mutedForeground` | `#6b6f68` | Subtitles, metadata, placeholders |
| `primary` | `#3f4e4f` | Primary buttons, active tabs, active chips |
| `primaryForeground`| `#f4f2ec` | Text on primary buttons/chips |
| `primarySoft` | `#cfd3cd` | Stepper backgrounds, subtle fills |
| `secondary` | `#d1ccbe` | Inactive chip background, secondary surfaces |
| `accent` | `#a27b5c` | Action highlights, kickers, FAB button |
| `accentForeground` | `#f8f5f0` | Text on accent buttons |
| `accentSoft` | `#e6d9cb` | Subtle accent highlights |
| `success` | `#4f6f52` | Accepted status, open ride status |
| `successSoft` | `#d3ddd0` | Success badge background |
| `warning` | `#b07d3c` | Pending status, warning notifications |
| `warningSoft` | `#ecdfc9` | Warning badge background |
| `destructive` | `#a34f43` | Rejection, logout button, error text |
| `destructiveSoft` | `#ecd3cd` | Destructive badge background |
| `border` / `input` | `#c4bfb1` | Container borders, input borders |
| `ring` | `#3f4e4f` | Focus ring outline |

### Dark Mode Tokens

| Token Name | Hex / RGBA Code | Purpose & Usage |
| :--- | :--- | :--- |
| `background` | `#2c3639` | Main dark background canvas |
| `card` | `#354044` | Card dark surface |
| `foreground` | `#dcd7c9` | Light text on dark surface |
| `mutedForeground` | `#a9aca3` | Subdued text on dark surface |
| `primary` | `#6d8683` | Slate primary dark variant |
| `primaryForeground`| `#1e2628` | Text on dark primary button |
| `secondary` | `#3a4649` | Secondary dark background |
| `accent` | `#c09675` | Terracotta accent dark variant |
| `success` | `#7fa382` | Sage success dark variant |
| `warning` | `#d3a15f` | Amber warning dark variant |
| `destructive` | `#cf7c6d` | Rust red dark variant |
| `border` / `input` | `rgba(220, 215, 201, 0.12)` | Light borders on dark surface |

---

## Typography Scale ([`typography.js`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/src/constants/typography.js))

Default system sans-serif font (`System` / `sans-serif`) with option to load `Outfit` display font and `DM Sans` body font on web.

| Token | Size (`px`) | Weight | Usage |
| :--- | :--- | :--- | :--- |
| `title` | `28px` | `700` (Bold) | Main screen titles (`AppHeader`) |
| `subtitle` | `15px` | `400` (Regular) | Header descriptions, sub-headings |
| `heading` | `18px` | `700` (Bold) | Section titles, card titles |
| `body` | `15px` | `400` (Regular) | Paragraph text, input text, body copy |
| `label` | `13px` | `600` (SemiBold) | Input labels, chip text |
| `caption` | `12px` | `500` (Medium) | Metadata dots, timestamps, status badge labels |

---

## Spacing Grid & Border Radius ([`spacing.js`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/src/constants/spacing.js))

### Spacing Scale (`4px` Base Grid)

```javascript
export const spacing = {
  xs: 4,   // Micro gaps, badge padding
  sm: 8,   // Element gaps, pill padding
  md: 12,  // Input padding, card inner gaps
  lg: 16,  // Container padding, screen margin
  xl: 24,  // Section spacing, modal padding
  xxl: 32, // Large section gaps, bottom clearance
};
```

### Radius Scale

```javascript
export const radius = {
  sm: 8,    // Badges, small action buttons
  md: 12,   // Inputs, stepper buttons, request rows
  lg: 16,   // Main cards, modal dialogs
  pill: 999 // Status pills, filter chips
};
```
