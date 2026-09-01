# Plattayam Hack Find — Design & Architecture Reference

---

## Executive Summary & Design Vision

**Hack Find** is Plattayam’s marketplace for finding hackathon teammates and discovering projects on campus. It operates as a natural extension of Plattayam Cabs:
- **Warm Cream Canvas**: `#f7f5f2` page canvas, `#ffffff` card content surfaces, `#eee9e2` hairline borders.
- **Visual Restraint**: 0 elevation / flat surfaces, 8px card radius, 12/24/48px spacing grid.
- **Electric Blue Primary Action**: `#0061fe` for buttons and primary CTAs.
- **Deep Magenta Accent**: `#cd2f7b` for kickers and badges.
- **Text-Only Status Indicators**: Plain colored text with **NO** colored boxes, pill borders, or button containers (`OPEN` in `#107c41`, `LOOKING FOR MEMBERS` in `#107c41`, `PENDING` in `#b35900`, `REJECTED` in `#d9381e`, `FULL` in `#716b61`).

---

## 01 CURRENT UI REFERENCE

The current rendered application screens serve as the baseline visual standard for all Hack Find components:

### A. Authentication & Navigation Baselines
| Screen | Desktop (1280×800) | Mobile (390×844) |
| :--- | :--- | :--- |
| **Login** | [`current-login-desktop.png`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/design/screenshots/current-login-desktop.png) | [`current-login-mobile.png`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/design/screenshots/current-login-mobile.png) |
| **Cabs Marketplace** | [`current-cabs-desktop.png`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/design/screenshots/current-cabs-desktop.png) | [`current-cabs-mobile.png`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/design/screenshots/current-cabs-mobile.png) |
| **Ride Details** | [`current-ride-details-desktop.png`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/design/screenshots/current-ride-details-desktop.png) | [`current-ride-details-mobile.png`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/design/screenshots/current-ride-details-mobile.png) |
| **Post Ride** | [`current-post-ride-desktop.png`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/design/screenshots/current-post-ride-desktop.png) | [`current-post-ride-mobile.png`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/design/screenshots/current-post-ride-mobile.png) |
| **My Rides & Requests** | [`current-my-rides-desktop.png`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/design/screenshots/current-my-rides-desktop.png) | [`current-my-rides-mobile.png`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/design/screenshots/current-my-rides-mobile.png) |
| **Profile** | [`current-profile-desktop.png`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/design/screenshots/current-profile-desktop.png) | [`current-profile-mobile.png`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/design/screenshots/current-profile-mobile.png) |
| **Lost & Found** | [`current-lost-found-desktop.png`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/design/screenshots/current-lost-found-desktop.png) | [`current-lost-found-mobile.png`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/design/screenshots/current-lost-found-mobile.png) |
| **Team Finder (Baseline)** | [`current-team-finder-desktop.png`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/design/screenshots/current-team-finder-desktop.png) | [`current-team-finder-mobile.png`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/design/screenshots/current-team-finder-mobile.png) |

---

## 02 HACK FIND: MARKETPLACE

### 1. Header, Search & Navigation Tabs
```text
┌──────────────────────────────────────────────────────────────┐
│  Hack Find                                                   │
│  Find teammates, discover teams & build hackathon projects   │
└──────────────────────────────────────────────────────────────┘
│ [ Search teams, people, skills, hackathons...        ]       │
│                                                              │
│ [ Teams (Active) ]     [ People ]                            │
│                                                              │
│ Filter Chips: [ All ] [ Looking for members ] [ Skills ▾ ] [ Hackathon ▾ ] │
```

### 2. Team Cards Specification
- **Surface**: White `#ffffff`, 1px border `#eee9e2`, 8px radius, 16px padding.
- **Header Row**: Team Name (`font-size: 18px`, `font-weight: 700`), Status (`LOOKING FOR MEMBERS` in `#107c41` text only / `FULL` in `#716b61`).
- **Hackathon Tag**: Event name (e.g. `HackOMania 2026` in `colors.accent` `#cd2f7b`).
- **Description**: 2-line clamped summary.
- **Skills Required**: `React · Python · FastAPI` (`colors.mutedForeground` `#716b61`).
- **Tech Stack**: `PostgreSQL · Docker` (`colors.mutedForeground`).
- **Member Count**: `3 / 6 members` (`font-size: 13px`, `font-weight: 600`).
- **Action**: Secondary / Primary `View Team` button.

### 3. Individual People Cards Specification
- **Header Row**: Candidate Name (e.g. `Dharun Karthikeyan`), Status (`OPEN TO JOIN` in `#107c41` text only / `TEAM FOUND` in `#716b61`).
- **Role Title**: `Frontend Developer` (`colors.foreground`).
- **Hackathon Tag**: `HackOMania 2026` (`colors.accent`).
- **Skills**: `React · JavaScript · Python`.
- **Tech Stack**: `Next.js · FastAPI · PostgreSQL`.
- **Experience**: `2+ years`.
- **Action**: `View Profile` button.

---

## 03 TEAM FLOWS

### 1. Team Details Screen
- **Header**: Title `Team Details`, accessible Back button (`← Back`).
- **Main Information Card**:
  - Team Name & Event Tag
  - Status text indicator (`LOOKING FOR MEMBERS` / `FULL`)
  - Description & Problem Statement (freeform user typed input)
  - Team Leader Profile Row (`formatFullName(creator.name)`)
  - Current Member Roster (list of accepted teammates)
  - Skills Required & Tech Stack
  - Contact Information
- **Join Request Action**:
  - For Non-Members: Primary blue button `Request to Join`.
  - For Pending Applicants: Informational text `REQUESTED` with status badge.
  - For Accepted Members: Status text `MEMBER`.
  - For Team Creator: Driver/Leader controls (`Join Requests` and `Delete Team`).

### 2. Create Team Screen
- **Form Fields**:
  1. `Team Name`: (e.g. `CodeCrafters`)
  2. `Hackathon / Event`: Freeform typed input (e.g. `Smart India Hackathon 2026`)
  3. `Problem Statement / Idea`: Freeform multi-line text input (e.g. `AI solution for campus resource management`)
  4. `Description`: Summary of project objectives
  5. `Skills Required`: Comma-separated or chip-added list (e.g. `React, FastAPI, OpenCV`)
  6. `Tech Stack`: (e.g. `PostgreSQL, PyTorch, Docker`)
  7. `Maximum Members`: Stepper control (`2` to `8` members)
  8. `Contact / Discord / Phone`: Contact details for applicants
- **Submit**: Primary button `Publish Team Post`.

### 3. Join Request & Review Flow
```text
Student Applicant
       │
       ▼  [Request to Join]
POST /teams/{team_id}/requests
       │
       ▼
Team Leader reviews incoming requests in Team Details / My Teams
       │
       ├── Accept ──► Member added to Team Roster (seats incremented)
       │
       └── Reject ──► Request status updated to REJECTED
```

### 4. My Teams Screen
- Shows all teams the user belongs to as:
  1. **Created Teams** (where user is Leader)
  2. **Joined Teams** (where user is Accepted Member)
  3. **Pending Requests** (where user sent an application)
- **Multi-team support**: Users can belong to multiple hackathon teams simultaneously.

### 5. Team Management Capabilities
- **Leader Powers**:
  - View full applicant details (via `UserProfileModal`).
  - Accept or Reject join requests.
  - Remove an existing member.
  - Delete team post.
- **Member Powers**:
  - Leave team at any time.

---

## 04 PEOPLE FLOWS

### 1. Individual Profile / Candidate Details Screen
- **Header**: Title `Candidate Profile`, Back button.
- **Content**:
  - Name, Roll Number, Branch/Year
  - Target Hackathon / Event
  - Open Status (`OPEN TO JOIN` text indicator)
  - Primary Role (e.g. `Backend Engineer`, `AI/ML Specialist`)
  - Skills List & Tech Stack
  - Experience Level & Portfolio / GitHub Links
  - About / Self Introduction
  - Contact Details
- **Primary CTA**: `Invite to Team` / `Contact Student`.

### 2. Create Individual Card Screen ("Create Profile Card")
- **Fields**:
  - Target Hackathon / Event (typed input)
  - Primary Role & Headline
  - Key Skills & Technologies
  - Experience Level (e.g. `Beginner`, `1-2 years`, `3+ years`)
  - About / Pitch
  - Portfolio / GitHub link
  - Availability Toggle (`Open to join`)
- **Submit**: Primary button `Publish Profile Card`.

---

## 05 FILTERS & SEARCH MODAL

- **Search Query**: Real-time filtering across Team Names, Hackathon names, Candidate names, and Skill tags.
- **Filter Facets**:
  - `Hackathon`: Filter by typed event tags
  - `Skillset`: Filter by language/framework (`Python`, `React`, `AI/ML`, etc.)
  - `Availability`: `Looking for Members` vs `Full` (for Teams); `Open to Join` vs `Placed` (for People)
  - `Team Size`: Range / Capacity filter

---

## 06 RESPONSIVE & LAYOUT SPECIFICATIONS

### Mobile Viewport (390×844)
- 1-column layout with 16px screen padding (`spacing.lg`).
- Cards occupy 100% width with 16px internal padding.
- Bottom tab navigation fixed at base with standard 4 tab items (`Cabs`, `Lost & Found`, `Hack Find`, `Profile`).

### Desktop Viewport (1280×800)
- Centered container with max-width `768px` or 2-column grid for marketplace cards.
- Preserves hairline borders, flat white card surfaces, and Dropbox editorial typography hierarchy.

---

## 07 DESIGN INTEGRITY CONFIRMATION

| Criterion | Implementation Status |
| :--- | :---: |
| **All Baseline Screenshots Captured** | 16/16 Playwright screenshots saved in [`design/screenshots/`](file:///c:/Users/dharu/anything/pro-j/plattayam-mobile/design/screenshots/) |
| **Text-Only Status Indicators** | 100% text color only; NO colored background pills, borders, or boxes |
| **Plattayam Visual Language** | Warm cream `#f7f5f2`, white cards `#ffffff`, blue CTA `#0061fe`, magenta accent `#cd2f7b` |
| **Team & Individual Cards** | Dual marketplace tabs: `Teams` & `People` |
| **Creator Approval Workflow** | Explicit request review flow with Accept / Reject |
| **Multiple Team Membership** | Fully supported without artificial 1-team constraints |
| **Team Leaving & Member Removal** | Clean creator & member management actions |
| **Typed Inputs for Hackathons** | Freeform text inputs for events and problem statements |
| **Zero Source Code Alteration** | Application code strictly preserved without modification |
