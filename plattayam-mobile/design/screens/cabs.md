# Cab Sharing Module Design Specification — `cabs.md`

## Module Classification: `[EXISTING V1 MODULE]`

The Cab Sharing module is fully implemented in v1 and connected to the FastAPI backend REST API (`/cab-queries`, `/cab-requests`, `/users`).

---

## Active Screen Inventory

### 1. `CabsScreen` ([`src/screens/CabsScreen.js`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/src/screens/CabsScreen.js))
- **Status**: Implemented & Active.
- **Header**: Title "Cabs", Subtitle "Find or post a shared ride from campus".
- **Controls**: Location search `TextInput` + filter chips (`All`, `Open`, `Full`).
- **Feed List**: `FlatList` rendered using `RideCard` components wrapped in `ScreenState`.
- **FAB**: Pinned bottom accent button "Post Ride" navigating to `PostRideScreen`.

### 2. `RideDetailsScreen` ([`src/screens/RideDetailsScreen.js`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/src/screens/RideDetailsScreen.js))
- **Status**: Implemented & Active.
- **Header**: Title "Ride details" with back navigation.
- **Content**:
  - Main ride details card (`from_loc → to_loc`, travel date, departure time, seats available, creator profile link).
  - Join request section:
    - If user is ride **owner**: list incoming `RequestRow` items with "Accept" and "Reject" actions, plus `UserProfileModal` trigger.
    - If user is **requester**: display current request status badge ("Pending", "Accepted", "Rejected").
    - If user is **visitor**: display "Request to Join" button (disabled if ride status is full).

### 3. `PostRideScreen` ([`src/screens/PostRideScreen.js`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/src/screens/PostRideScreen.js))
- **Status**: Implemented & Active.
- **Header**: Title "Post Ride", Subtitle "Share empty seats on your cab".
- **Form Controls**:
  - `From Location`: Text input.
  - `To Location`: Text input.
  - `Travel Date`: Date picker (`@react-native-community/datetimepicker`).
  - `Departure Time`: Time picker.
  - `Seats Available`: Stepper control (`1` to `8` seats).
- **CTA**: "Post ride" primary button.

### 4. `MyRidesScreen` ([`src/screens/MyRidesScreen.js`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/src/screens/MyRidesScreen.js))
- **Status**: Implemented & Active.
- **Header**: Title "My Rides", Subtitle "Your posts, joins, and requests".
- **Sections**: `Posted rides (N)`, `Joined rides (N)`, `Requests (N)`.
