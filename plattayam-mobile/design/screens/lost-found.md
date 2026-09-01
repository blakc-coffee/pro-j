# Phase 2 Lost & Found Module Design Specification — `lost-found.md`

## Module Classification: `[FUTURE PHASE 2 MODULE - PROPOSED]`

Currently represented in the active app as a `ComingSoon` placeholder tab on [`LostFoundScreen.js`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/src/screens/LostFoundScreen.js). No backend models or API endpoints exist yet.

---

## Planned Screen & Component Specifications

### 1. `LostFoundScreen` (Tab Feed - `[PROPOSED]`)
- **Current State**: Displays `ComingSoon` card component.
- **Phase 2 Design**:
  - Header: Title "Lost & Found", Subtitle "Report or recover campus items".
  - Search & Filters: Search input + category filter chips (`All`, `Lost`, `Found`, `Resolved`, `Electronics`, `ID Cards`, `Keys`, `Other`).
  - Feed List: `FlatList` rendering `ItemCard` primitives wrapped in `ScreenState`.
  - FAB: Pinned accent button "Report Item" navigating to `ReportItemScreen`.

### 2. `ItemCard` (`[PROPOSED]`)
- Container: `Card` primitive.
- Header row: Category tag, Status Badge (`Lost` in `destructiveSoft`, `Found` in `successSoft`, `Claimed` in `secondary`).
- Title: Item name (e.g. "Black Earbuds in Mess 1").
- Metadata: Date lost/found, location, reporter name.
- Action: "View Details" / "Claim Item" button.

### 3. `ItemDetailsModal` (`[PROPOSED]`)
- Content: Full item description, photo thumbnail placeholder, exact location, poster contact details (`UserProfileModal` trigger), and claim request submission button.

### 4. `ReportItemScreen` (`[PROPOSED]`)
- Form Controls: Item type toggle (`Lost` vs `Found`), Item title `FormInput`, Category select, Location `FormInput`, Date picker, Multiline description, Contact preference toggle.
- CTA: "Submit Report" primary button.
