# Phase 2 Hackathon Team Finder Module Design Specification — `team-finder.md`

## Module Classification: `[FUTURE PHASE 2 MODULE - PROPOSED]`

Currently represented in the active app as a `ComingSoon` placeholder tab on [`TeamFinderScreen.js`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/src/screens/TeamFinderScreen.js). No backend models or API endpoints exist yet.

---

## Planned Screen & Component Specifications

### 1. `TeamFinderScreen` (Tab Feed - `[PROPOSED]`)
- **Current State**: Displays `ComingSoon` card component.
- **Phase 2 Design**:
  - Header: Title "Team Finder", Subtitle "Find hackathon teammates & projects".
  - Search & Filters: Search input + filter chips (`All`, `Recruiting`, `Full`, `SIH 2026`, `AI/ML`, `Web`, `Mobile`, `UI/UX`).
  - Feed List: `FlatList` rendering `TeamCard` primitives wrapped in `ScreenState`.
  - FAB: Pinned accent button "Create Team Post" navigating to `PostTeamScreen`.

### 2. `TeamCard` (`[PROPOSED]`)
- Container: `Card` primitive.
- Header row: Hackathon event tag, Status Badge (`Recruiting` in `successSoft`, `Full` in `secondary`).
- Title: Team / Project Name (e.g. "Team Automated Hydroponics").
- Required Skill Badges: Array of pill badges (`Python`, `React Native`, `FastAPI`).
- Member Progress: Capacity text (`3/5 members filled`).
- Action: "View Details" / "Apply to Join" button.

### 3. `TeamDetailsScreen` / Modal (`[PROPOSED]`)
- Content: Problem statement / idea, full roster of accepted members with role tags (`Leader`, `Backend`, `Frontend`, `AI`), list of open positions, and join application form with note input.

### 4. `PostTeamScreen` (`[PROPOSED]`)
- Form Controls: Post type toggle (`Looking for Teammates` vs `Individual Looking for Team`), Hackathon name, Project title, Problem statement, Team size stepper (`2` to `6`), Required skills multi-select, Roles needed checkboxes.
- CTA: "Publish Team Post" primary button.
