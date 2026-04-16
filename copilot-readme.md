# Padel Manager — Copilot Context & Development Roadmap

> This document is the authoritative AI-assistant briefing file for the Padel Manager project. It is the first file to read at the start of any development session. It covers project architecture, feature inventory, coding conventions, and the full development roadmap including the upcoming iOS app.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Backend Architecture](#3-backend-architecture)
4. [Frontend Architecture (Web)](#4-frontend-architecture-web)
5. [Development Setup](#5-development-setup)
6. [Code Conventions & Patterns](#6-code-conventions--patterns)
7. [Web App — Improvement Roadmap](#7-web-app--improvement-roadmap)
8. [iOS App — Plan & Architecture](#8-ios-app--plan--architecture)
9. [Full Development Roadmap](#9-full-development-roadmap)

---

## 1. Project Overview

**Padel Manager** is a full-stack platform for managing padel court bookings and competitive match play. The app is written in Romanian (UI strings) but all code, identifiers, and technical documentation are in English.

### Core use cases
- Players book courts at specific locations and time slots
- A reservation automatically creates an associated match with team slots
- Players fill teams, track scores, and view their stats
- Admins manage locations, courts, users, and tournaments
- A live referee view allows real-time scoring; spectators can watch live

### Who uses it
- **Players** (`role: "player"`) — the default role. Can book courts, manage their matches, view stats and tournaments.
- **Admins** (`role: "admin"`) — can manage all data (locations, courts, users, tournaments) and act as live referees.

---

## 2. Repository Structure

```
TIC_Project/                        ← Git root (monorepo)
├── README.md                       ← Short Romanian-language README
├── copilot-readme.md               ← This file
├── SERVER/                         ← Node.js + Express backend
│   ├── package.json
│   └── src/
│       ├── index.js                ← Server entry point (port 4000)
│       ├── app.js                  ← Express setup, middleware stack
│       ├── config/
│       │   ├── env.js
│       │   ├── firebase.js         ← Firebase Admin SDK init
│       │   └── logger.js
│       ├── core/
│       │   ├── errors.js           ← Custom error classes (currently empty — needs work)
│       │   ├── validation.js       ← Input validators (currently empty — needs work)
│       │   └── http.js             ← HTTP utilities (currently empty)
│       ├── middleware/
│       │   ├── authMiddleware.js   ← Firebase JWT verification + user bootstrap
│       │   ├── roleMiddleware.js   ← requireRole(), requireSameUser()
│       │   ├── errorHandler.js     ← Global error handler
│       │   └── notFound.js         ← 404 handler
│       ├── routes/
│       │   └── index.js            ← Aggregates all module routes under /api
│       └── modules/
│           ├── auth/               ← POST /auth/me
│           ├── users/              ← User CRUD + role management
│           ├── locations/          ← Locations + courts (embedded)
│           ├── matches/            ← Match lifecycle
│           ├── reservations/       ← Court slot booking (creates match atomically)
│           ├── tournaments/        ← Tournament management
│           ├── live/               ← Live match scoring state
│           └── stats/              ← Computed player statistics
└── CLIENT/
    └── CLIENT/                     ← Vue 3 app (nested structure — actual root)
        ├── package.json
        ├── vite.config.js          ← Proxies /api → localhost:4000
        └── src/
            ├── main.js
            ├── App.vue
            ├── style.css
            ├── api/                ← Axios client + per-module API functions
            ├── components/
            │   ├── ui/             ← 24+ UI primitives (Button, Card, Input, Modal…)
            │   └── common/         ← AppToolbar, SideDrawer, PlayerSearchInput
            ├── composables/        ← useLookups.js (location/user name resolution)
            ├── layouts/            ← MainLayout.vue
            ├── router/             ← index.js (route guards, session enforcement)
            ├── services/           ← firebase.js (Firebase client SDK init)
            ├── stores/             ← Global Pinia stores (useUsersStore)
            └── modules/
                ├── auth/           ← Login, Register, useAuthStore
                ├── home/           ← HomeView (dashboard)
                ├── profile/        ← ProfileView
                ├── matches/        ← MatchesListView, BookMatchModal, MatchDetailsModal
                ├── locations/      ← LocationsListView, LocationDetailsView
                ├── tournaments/    ← TournamentListView, TournamentCreateWizard
                ├── live/           ← LiveRefereeView, LiveSpectatorView
                └── admin/          ← AdminDashboardView + sub-views + 3 stores
```

---

## 3. Backend Architecture

### Tech Stack
| Concern | Technology |
|---------|-----------|
| Runtime | Node.js (LTS), ES modules |
| Framework | Express.js 4.21 |
| Database | Firebase Firestore (NoSQL) |
| Auth | Firebase Auth (Admin SDK — server-side JWT verification) |
| Config | dotenv |
| Logging | Morgan (HTTP) + custom logger |
| Dev | Nodemon |

### Authentication Flow
1. Client logs in via Firebase Auth (email/password).
2. Client obtains a Firebase ID token.
3. Every API request includes `Authorization: Bearer <ID_TOKEN>`.
4. `authMiddleware.js` calls `admin.auth().verifyIdToken(token)`.
5. On success, the user's Firestore profile is loaded (auto-created on first login via `bootstrapUserFromToken()`).
6. `req.user` is populated with `{ uid, email, displayName, role, … }`.

### Role System
- `player` — default. All standard operations.
- `admin` — full access including user management and privileged write operations.
- Enforced server-side via `requireRole(...roles)` and `requireSameUser` middleware.

### API Reference

**Base URL:** `/api`

#### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/me` | Bearer | Bootstrap + return current user profile |

#### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/` | Admin | List all users |
| GET | `/users/search?q=&limit=` | Bearer | Search users by displayName |
| GET | `/users/profile/:id` or `/users/profile/me` | Bearer (self or admin) | Get user profile |
| PATCH | `/users/:id` | Bearer (self or admin) | Update profile fields |
| PATCH | `/users/:id/role` | Admin | Change user role |

#### Locations & Courts
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/locations/` | Public | List all locations |
| GET | `/locations/:id` | Public | Get location + courts |
| POST | `/locations/` | Admin | Create location |
| PUT | `/locations/:id` | Admin | Update location |
| DELETE | `/locations/:id` | Admin | Delete location |
| POST | `/locations/:id/courts` | Admin | Add court to location |
| PUT | `/locations/:id/courts/:courtId` | Admin | Update court |
| DELETE | `/locations/:id/courts/:courtId` | Admin | Delete court |

> Courts are stored as an embedded array inside the location document, not a separate collection.

#### Matches
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/matches/` | Bearer | List matches for current user (creator or participant) |
| GET | `/matches/count/:status?` | Bearer | Count matches by status |
| GET | `/matches/:id` | Bearer (participant or admin) | Get match details |
| POST | `/matches/` | Bearer | Create match |
| PATCH | `/matches/:id` | Bearer (participant or admin) | Update match (teams, score, status) |
| DELETE | `/matches/:id` | Bearer (participant or admin) | Delete match |

**Auto-status reconciliation** (runs on every GET):
- `scheduled` → `ongoing` when `now >= scheduledAt`
- `scheduled` | `ongoing` → `completed` when `now >= endAt`
- `draft`, `cancelled` — never auto-transitioned

#### Reservations
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/reservations/` | Bearer | List user's reservations (limit 100) |
| GET | `/reservations/availability?courtId=&date=YYYY-MM-DD&durationMinutes=` | Bearer | Available 30-min time slots |
| POST | `/reservations/` | Bearer | Book court slot — atomically creates reservation + match |

> Overlap detection returns `409 Conflict` if slot is taken.

#### Tournaments
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tournaments/` | Bearer | List all tournaments (auto-status reconciliation) |
| GET | `/tournaments/:id` | Bearer | Get tournament |
| POST | `/tournaments/` | Admin | Create tournament |
| PUT | `/tournaments/:id` | Admin | Update tournament |
| DELETE | `/tournaments/:id` | Admin | Delete tournament |

**Auto-status**: `scheduled` → `running` (when `now >= startDate`), `running` → `finished` (when `now >= endDate`).

#### Live Scoring
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/live/:matchId` | Bearer | Get live state for a match |
| PUT | `/live/` | Bearer | Upsert live state (`{ matchId, state: <any JSON> }`) |

#### Statistics
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/stats/me` | Bearer | Current user's computed stats |

Returned shape: `{ uid, gamesPlayed, wins, losses, mostFrequentTeammate, mostFrequentOpponent, mostPlayedLocation, updatedAt }`

### Firestore Schema

| Collection | Key Fields |
|-----------|-----------|
| `users` | `uid`, `email`, `displayName`, `role` (`player`/`admin`), `status`, `profilePicUrl`, `preferredSide`, `playingLevel`, `preferredPosition`, `preferredTime`, timestamps |
| `locations` | `name`, `address`, `city`, `courts[]` (`{id, name, isIndoor}`), `openHour`, `closeHour`, timestamps |
| `tournaments` | `name`, `locationId`, `startDate`, `endDate`, `status` (`draft`/`scheduled`/`running`/`finished`), `createdBy`, timestamps |
| `matches` | `createdBy`, `tournamentId`, `locationId`, `courtId`, `scheduledAt`, `endAt`, `status` (`draft`/`scheduled`/`ongoing`/`completed`/`cancelled`), `teams` (`{team1:[uid,uid], team2:[uid,uid]}`), `score` (`{sets:[{t1,t2}]}`), `winnerTeam` (1/2/null), timestamps |
| `reservations` | `createdBy`, `locationId`, `courtId`, `startAt`, `endAt`, `matchId`, `status`, timestamps |
| `live` | `matchId`, `state` (any JSON), `createdBy`, timestamps |

---

## 4. Frontend Architecture (Web)

### Tech Stack
| Concern | Technology |
|---------|-----------|
| Framework | Vue 3 (Composition API + `<script setup>`) |
| Build tool | Vite 7 |
| State management | Pinia |
| Routing | Vue Router 4 |
| HTTP | Axios (with Firebase token interceptor) |
| Auth | Firebase client SDK |
| Linting | ESLint + Prettier |

### Route Map
| Path | Name | Auth | Admin | Component |
|------|------|------|-------|-----------|
| `/login` | login | Guest only | — | LoginView |
| `/register` | register | Guest only | — | RegisterView |
| `/` | home | ✅ | — | HomeView |
| `/profile` | profile | ✅ | — | ProfileView |
| `/friendly` | friendly-list | ✅ | — | MatchesListView |
| `/friendly/create` | friendly-create | ✅ | — | BookMatchModal |
| `/locations` | locations-list | ✅ | — | LocationsListView |
| `/locations/:id` | location-details | ✅ | — | LocationDetailsView |
| `/tournaments` | tournaments-list | ✅ | — | TournamentListView |
| `/tournaments/create` | tournaments-create | ✅ | — | TournamentCreateWizard |
| `/live/referee/:matchId` | live-referee | ✅ | ✅ | LiveRefereeView |
| `/live/spectator/:matchId` | live-spectator | ✅ | — | LiveSpectatorView |
| `/admin` | admin | ✅ | ✅ | AdminDashboardView |

**Guards**: session max-age enforcement (30 days), redirect unauthenticated users to `/login`, redirect authenticated guests away from login/register, redirect admin to `/admin` from home.

### State Management (Pinia Stores)
| Store | Location | Responsibility |
|-------|----------|----------------|
| `useAuthStore` | `modules/auth/store/` | Firebase auth state, profile, login/register/logout, session enforcement |
| `useUsersStore` | `stores/` | Global user lookup cache (search, byId Map) |
| `useLocationsStore` | `modules/locations/store/` | Location list + CRUD |
| `useBookMatchModalStore` | `modules/matches/store/` | Global modal open/close state |
| `useAdminStore` | `modules/admin/store/` | Admin user list + promote |
| `useAdminLocationsStore` | `modules/admin/store/` | Admin location + court management |
| `useAdminTournamentsStore` | `modules/admin/store/` | Admin tournament management |

### API Layer (`src/api/`)
- **`httpClient.js`** — Axios instance. Request interceptor attaches `Authorization: Bearer <Firebase ID token>` to every request. Timeout: 10 s.
- Per-module files: `authApi.js`, `usersApi.js`, `locationsApi.js`, `matchesApi.js`, `tournamentsApi.js`, `reservationsApi.js`, `liveApi.js`, `statsApi.js`

### Key Composable
**`useLookups.js`** — resolves IDs to display names for locations, users, and courts. Call `warmupLookups()` on app mount to pre-load data.

### UI Component Library (`src/components/ui/`)
`UiButton`, `UiCard`, `UiInput`, `UiSelect`, `UiModal`, `UiSegmented`, `UiPill`, `UiIconButton`, `UiNotice`, `UiStateCard`, `UiSkeletonLines`, and more.

---

## 5. Development Setup

### Environment Variables

**Backend** (`SERVER/.env`):
```
PORT=4000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Frontend** (`CLIENT/CLIENT/.env`):
```
VITE_API_BASE_URL=http://localhost:4000/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

### Running Locally

```bash
# Terminal 1 — Backend
cd SERVER
npm install
npm run dev          # Starts on port 4000 with nodemon

# Terminal 2 — Frontend
cd CLIENT/CLIENT
npm install
npm run dev          # Starts on port 5173; /api proxied to localhost:4000
```

### Other Commands
```bash
# Frontend
npm run build        # Production build → dist/
npm run lint         # ESLint auto-fix
npm run format       # Prettier format
```

---

## 6. Code Conventions & Patterns

### Backend
- **Module structure**: every feature has `*.routes.js` → `*.controller.js` → `*.service.js` + `*.model.js`
- Controllers handle HTTP (parse req, call service, send res). Services contain all business logic.
- Models define the Firestore document shape as plain objects (no ORM).
- Auth is applied via middleware in the routes file, not inside controllers.
- Errors should propagate to `errorHandler.js` via `next(err)`.

### Frontend
- **Feature modules** under `src/modules/` mirror backend modules.
- Each module owns its views, components, and Pinia store.
- API calls live in `src/api/`, never inside components or stores directly.
- Stores orchestrate API calls and hold reactive state.
- Composables (`src/composables/`) hold reusable logic that doesn't fit a single store.
- Use the UI component library from `src/components/ui/` — don't create one-off styled elements.

### Naming
- Files: `camelCase.js` for Vue composables/stores, `PascalCase.vue` for components
- Variables/functions: `camelCase`
- Pinia stores: named `use<Feature>Store`
- API functions: named by HTTP verb + resource (e.g., `fetchMatches`, `createReservation`, `updateUser`)

---

## 7. Web App — Improvement Roadmap

### Phase W1 — Bug Fixes & Polish
- [ ] Fill in `SERVER/src/core/errors.js` with custom error classes (`NotFoundError`, `ForbiddenError`, `ConflictError`, `ValidationError`) — currently an empty file
- [ ] Fill in `SERVER/src/core/validation.js` with reusable input validators — currently empty
- [ ] Improve `errorHandler.js` to use the new custom error classes for consistent API error responses
- [ ] Improve loading/error states across all views (use `UiStateCard` and `UiSkeletonLines` consistently)
- [ ] Edge cases in `BookMatchModal`: prevent booking past time slots, refresh availability after creation
- [ ] Better empty states when lists are empty (matches, tournaments, locations)
- [ ] Form validation feedback on login/register

### Phase W2 — New Features
- [ ] **Player invite system**: search for players and invite them to fill match team slots
- [ ] **Match history filtering**: filter by status, date range, location
- [ ] **Tournament bracket/standings view**: visual bracket or table for tournament matches
- [ ] **Match result entry**: allow participants to enter final score after match ends
- [ ] **Public player profiles**: view another player's stats and match history

### Phase W3 — Backend Improvements
- [ ] Add input validation in all `*.controller.js` using `core/validation.js`
- [ ] Add `GET /tournaments/:id/matches` to fetch all matches for a tournament
- [ ] Replace fixed-limit queries with cursor-based pagination (`startAfter` in Firestore)
- [ ] Real-time live scoring: replace polling with SSE (Server-Sent Events) on `GET /live/:matchId`
- [ ] Consider API versioning prefix (`/api/v1/`) before the iOS app goes into production
- [ ] Add `GET /users/:id/stats` (public) alongside `/stats/me`

---

## 8. iOS App — Plan & Architecture

### Decision
- **Framework**: SwiftUI (native Swift)
- **Scope**: MVP first, then expand in phases
- **Backend**: Same Express + Firestore backend — zero backend changes needed for MVP
- **Auth**: Firebase iOS SDK (same Firebase project, same auth mechanism)

### Proposed Directory Structure
```
IOS/
└── PadelManager/
    ├── PadelManagerApp.swift       ← @main entry point
    ├── App/
    │   └── AppState.swift          ← Observable global state (auth, user)
    ├── Services/
    │   ├── APIClient.swift         ← URLSession wrapper; injects Bearer token
    │   ├── AuthService.swift       ← Firebase Auth wrapper (login, register, logout, token)
    │   └── FirebaseConfig.swift    ← GoogleService-Info.plist loader
    ├── Models/                     ← Codable structs mirroring Firestore schemas
    │   ├── User.swift
    │   ├── Match.swift
    │   ├── Location.swift
    │   ├── Court.swift
    │   ├── Reservation.swift
    │   └── Stats.swift
    ├── Modules/
    │   ├── Auth/
    │   │   ├── LoginView.swift
    │   │   └── RegisterView.swift
    │   ├── Home/
    │   │   └── HomeView.swift      ← Upcoming matches + quick book button
    │   ├── Matches/
    │   │   ├── MatchesListView.swift
    │   │   ├── MatchDetailView.swift
    │   │   └── BookMatchView.swift  ← Location → Court → Date/Time → Create
    │   └── Profile/
    │       └── ProfileView.swift    ← User info + personal stats
    └── UI/                         ← Reusable SwiftUI components
        ├── PrimaryButton.swift
        ├── MatchCard.swift
        ├── LoadingView.swift
        └── ErrorView.swift
```

### Authentication on iOS
```swift
// After Firebase login:
let token = try await Auth.auth().currentUser?.getIDToken()
// Attach to every request:
request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
// Call POST /api/auth/me to bootstrap user in Firestore
```

### MVP Feature Set (Phase iOS-1)
| Feature | Screen | Backend endpoint |
|---------|--------|-----------------|
| Login | LoginView | Firebase Auth → POST /auth/me |
| Register | RegisterView | Firebase Auth → POST /auth/me |
| Home dashboard | HomeView | GET /matches (filter upcoming) |
| Matches list | MatchesListView | GET /matches |
| Match detail | MatchDetailView | GET /matches/:id |
| Book a match | BookMatchView (multi-step) | GET /locations → GET /reservations/availability → POST /reservations |
| Profile + stats | ProfileView | GET /users/profile/me + GET /stats/me |

### iOS Phase 2 (after MVP)
- Tournaments list + details
- Live spectator view (polling or SSE)
- Push notifications (APNs integration)

### iOS Phase 3
- Live referee view (admin)
- Admin panel (locations, users, tournaments)

### Notes for iOS development
- The app is currently in Romanian. iOS app UI strings should also be Romanian for consistency.
- Match teams are arrays of user IDs — always resolve to display names using a user cache (same pattern as `useLookups.js` on web).
- The backend's court availability endpoint uses 30-min slots — display as a time picker grid.
- When creating a reservation, the backend atomically creates the linked match — no separate match creation call needed.

---

## 9. Full Development Roadmap

```
NOW
 │
 ├── Phase W1 — Web bug fixes & polish          (priority: high)
 │     └─ Error classes, validation, loading states, empty states
 │
 ├── Phase W2 — Web new features                (priority: medium)
 │     └─ Player invites, match history filter, score entry, public profiles
 │
 ├── Phase iOS-1 — iOS MVP (SwiftUI)            (priority: high, parallel to W2)
 │     └─ Auth, Home, Matches list/detail, Book a match, Profile/Stats
 │
 ├── Phase W3 — Backend improvements            (priority: medium)
 │     └─ Validation, pagination, SSE for live, API versioning
 │
 ├── Phase iOS-2 — iOS feature expansion
 │     └─ Tournaments, live spectator, push notifications
 │
 └── Phase iOS-3 — iOS admin + advanced
       └─ Referee view, admin panel, full feature parity with web
```

### Guiding principles
1. **Single backend, multiple clients** — the Express + Firestore backend is the source of truth. Web and iOS consume the same API.
2. **Feature-first modules** — both backend and frontend are organized by feature. New features follow the same pattern.
3. **Don't break existing flows** — when adding backend changes, be careful not to break existing web clients. Consider versioning for breaking changes.
4. **iOS mirrors web logic** — the same data models and API patterns apply. Use `Codable` structs that match backend JSON exactly.
5. **Auth is always Firebase** — never bypass Firebase Auth. Both clients use the same Firebase project.
