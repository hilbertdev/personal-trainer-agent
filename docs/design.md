# Personal Trainer Agent — Design Document

**Status:** Phase 1 beta (brownfield)  
**Last updated:** June 2026  
**Audience:** Product, engineering, and design contributors

---

## 1. Overview

Personal Trainer Agent is a training platform that helps athletes **plan mesocycles**, **log workouts**, and **monitor fatigue and hypertrophy trends**. The product separates **training domain logic** from **external data providers** (Strava today; Garmin/Coros/Apple Health later) so coaching intelligence stays in the platform.

This document describes the **current shipped UI and behaviour** across the two client apps and their backends.

### Product goals (Phase 1)

- Create structured training programs (splits, weekly schedule, mesocycle length, progression rules).
- Collect a **baseline week** of real sessions before generating a full mesocycle.
- Log **today's workout** with set/rep/weight capture.
- Surface **fatigue analysis**, recovery heuristics, and **4-week hypertrophy projections** on a demo dashboard.
- Optional **Strava activity sync** to enrich baseline logging.
- Keep hosting cost near zero (SQLite, static frontend, optional Fly.io + Vercel).

### Non-goals (current release)

- Full multi-tenant SaaS training workflows on mobile.
- Password auth (OTP-only on SaaS scaffold).
- Native mobile workout planner (not yet built).
- Production email delivery in local dev (smtp4dev captures OTP).

---

## 2. System context

```text
┌─────────────────────────────────────────────────────────────────┐
│                         Client applications                      │
├──────────────────────────────┬──────────────────────────────────┤
│  Web (frontend/)             │  Mobile (src/mobile/)             │
│  Vite + React + TS           │  Expo + React Native              │
│  Port 5173 (dev)             │  Port 8081 (Metro web / Expo Go)  │
└──────────────┬───────────────┴──────────────────┬───────────────┘
               │                                   │
               ▼                                   ▼
┌──────────────────────────┐    ┌──────────────────────────────────┐
│  Training.Api :8080      │    │  PersonalTrainer.Api :5075       │
│  SQLite, no auth         │    │  Postgres + Redis, OTP + JWT       │
│  Programs, workouts,     │    │  Organizations, auth only        │
│  fatigue beta endpoints  │    │  (no training UI yet)            │
└──────────────────────────┘    └──────────────────────────────────┘
               │
               ▼
┌──────────────────────────┐
│  Training.Strava         │  (optional; STRAVA_ACCESS_TOKEN)
└──────────────────────────┘
```

| App | Primary API | Auth | Training features |
|-----|-------------|------|-------------------|
| Web | `Training.Api` | None (local `athleteId` UUID) | Full planner |
| Mobile | `PersonalTrainer.Api` | Email OTP + JWT | Auth + org list only |

---

## 3. Domain model (training)

Core concepts live in `frontend/src/lib/program.ts` and mirror backend contracts under `Training.Api/Contracts`.

### Program lifecycle

```text
[No program]
     │ Create Workout Plan (wizard or preset)
     ▼
collecting_baseline_week  ──generateMesocycle()──►  active_mesocycle
     │                                                    │
     │ log baseline sessions                            │ Today / Plan tabs
     │ optional Strava sync                             │ live workout logging
     ▼                                                    ▼
 resetProgram() ◄────────────────────────────────── endProgram() (API)
```

### Key entities

| Entity | Description |
|--------|-------------|
| **Program** | Named plan: split type, weekly cycle, mesocycle length, progression settings, status, baseline week, optional mesocycle. |
| **WeeklyCycle** | Seven days (Mon–Sun); each day has a workout type or rest (`null`). |
| **SplitType** | `PPL` or `UPPER_LOWER`; drives slot definitions and default templates. |
| **BaselineWeek** | Array of `LoggedWorkout` for the calibration week. |
| **Mesocycle** | Generated multi-week schedule with per-day planned/logged workouts. |
| **LoggedWorkout / LoggedExercise** | User session with sets, reps, RPE, muscle groups, substitutions. |
| **ProgramPreset** | e.g. "Pure Bodybuilding" — multi-block template with seeded baselines. |
| **StravaActivity** | Provider-neutral activity summary for mapping to workout types. |

### Athlete identity (web)

- Stable GUID in `localStorage` (`pta:athlete-id`) or `VITE_ATHLETE_ID`.
- Default fallback: `11111111-1111-1111-1111-111111111111`.
- Passed as `athleteId` on all Training.Api program/workout calls.

---

## 4. Web application design (`frontend/`)

### 4.1 Information architecture

Routing is **state-driven**, not URL-based (`app-router.tsx`):

| Condition | Primary view |
|-----------|--------------|
| No `activeProgram` | **Beta dashboard** |
| `status === collecting_baseline_week` | **Baseline week** (in app shell) |
| `status === active_mesocycle` | **Programs** / **Today** / **Plan** tabs |

Global overlay: **Create Workout Plan** wizard (modal, always mounted).

### 4.2 Screen inventory

#### Beta dashboard (`beta-dashboard.tsx`)

**Purpose:** Entry point and analytics demo when no active program exists.

**Content:**

- Hero with fatigue score, recovery status, weekly summary.
- Workout cards for sample week (checkbox completion → `POST /api/progress`).
- Collapsible exercise details per day.
- Warnings and recommendations from analyzer.
- 4-week hypertrophy projection tabs.
- CTA: **Create Workout Plan**.

**Data:** `GET /api/workouts/sample`, `POST /api/workouts/analyze`, `GET/POST /api/progress`. Falls back to mock data if API unreachable (`VITE_USE_MOCK_DATA`).

#### Create Workout Plan wizard (`create-plan-wizard.tsx`)

**Purpose:** Six-step modal to define a new program.

| Step | Input |
|------|--------|
| 1 | Plan name |
| 2 | Split type or preset shortcut |
| 3 | Weekly schedule (assign workout types per day) |
| 4 | Mesocycle length (weeks) |
| 5 | Progression (rep increment, set progression, RPE progression) |
| 6 | Review and create |

**Actions:**

- **Custom path:** `createProgram()` → local `Program` with `collecting_baseline_week`.
- **Preset path:** `createPresetProgram()` → may start `active_mesocycle` immediately with block templates.
- On activation, `importProgram()` syncs to backend once per local program id.

#### Baseline week (`baseline-week-view.tsx`)

**Purpose:** Log the calibration week before mesocycle generation.

**Features:**

- Per-day session cards aligned to weekly cycle.
- **Log workout** modal (manual entry).
- Progress toward required session count.
- **Strava sync** + mapping modal (match activities to workout types).
- **Generate mesocycle** when baseline complete.
- Reset program.

#### Programs (`programs-page.tsx`)

**Purpose:** Backend-backed program list.

**Features:**

- Active vs archived programs (`GET /api/programs?athleteId=`).
- Stats: weeks, sessions/week, current week.
- **End program** → `POST /api/programs/{id}/end`.
- **Create Workout Plan** entry point.

#### Today (`current-workout-page.tsx` + `live-workout-view.tsx`)

**Purpose:** Execute today's planned session.

**Flow:**

1. Fetch `GET /api/workouts/today?athleteId=&date=`.
2. Show rest day or workout summary with **Start workout**.
3. **Live workout view:** step through exercises, log sets/reps/weight, substitutions, notes.
4. Save via `POST /api/workouts/{templateId}/execute`.

#### Plan (`active-mesocycle-view.tsx`)

**Purpose:** Mesocycle calendar and week management.

**Features:**

- Week selector (1…N).
- Per-day cards: planned workout type, logged state, edit.
- **Log workout** modal for any slot.
- **Advance week** control.
- Reset program.

### 4.3 App shell (`app-shell.tsx`)

- Brand header: "Personal Trainer Agent" + Phase 1 beta badge.
- **Create Workout Plan** (always visible).
- Theme toggle (light/dark).
- Tab navigation: Programs; + Today & Plan when mesocycle active.
- Mobile: hamburger drawer for tabs (`mobile-nav-drawer.tsx`).

### 4.4 Client state

| Layer | Responsibility |
|-------|----------------|
| `ProgramProvider` | Active program, wizard open/close, CRUD on program, Strava sync, localStorage persistence (`pta:active-program`). |
| `NavProvider` | Tab view: `programs` \| `today` \| `plan`. |
| React Query | Server state: sample workouts, progress, programs list, today's workout. |

**Local ↔ backend link:** `pta:program-backend-link` maps local program id → imported backend program id.

### 4.5 API clients

| Module | Backend | Endpoints |
|--------|---------|-----------|
| `lib/api.ts` | Training.Api | Sample, analyze, progress (beta dashboard) |
| `lib/training-api.ts` | Training.Api | Programs import/list/end, today, execute |
| `lib/strava.ts` | Training.Api | `POST /api/strava/sync` |

Dev: Vite proxies `/api` → `localhost:8080`. Mock fallback when `VITE_USE_MOCK_DATA !== "false"`.

### 4.6 Visual design

- **Aesthetic:** High-contrast fitness UI — lime accent on zinc neutrals, radial gradients, rounded cards.
- **Components:** shadcn-style primitives (`components/ui/`: Button, Card, Badge, Modal, Checkbox, Progress).
- **Icons:** Lucide React.
- **Responsive:** Mobile-first; drawer nav below `md`; touch-friendly min heights.
- **Theming:** CSS variables + `theme-provider.tsx`; persisted preference.

---

## 5. Mobile application design (`src/mobile/`)

### 5.1 Purpose (current)

Scaffold for **QBS SaaS**: OTP authentication and organization listing. Training planner **not implemented**.

### 5.2 Navigation

```text
Stack
├── (auth)
│   ├── login      — email → request OTP
│   └── verify     — 6-digit code → JWT
└── (app)          — requires auth (AuthGate)
    ├── index      — Home: organizations list
    └── profile    — Sign out
```

### 5.3 Auth flow

1. `POST /api/auth/request-otp` with email.
2. Local dev: OTP in smtp4dev (http://localhost:5050), not real inbox.
3. `POST /api/auth/verify-otp` → JWT + org id.
4. Token in SecureStore (native) or `localStorage` (web dev fallback).

### 5.4 API client

- `src/api/client.ts` — axios to `EXPO_PUBLIC_API_URL` (5075).
- Web dev: empty URL + Metro proxy `/api` → 5075 (same-origin, no CORS).
- Device: `http://<lan-ip>:5075`.

---

## 6. Backend capabilities (training)

Relevant to web UI (`Training.Api`):

| Area | Endpoints |
|------|-----------|
| Beta analytics | `GET /api/workouts/sample`, `POST /api/workouts/analyze`, `GET/POST /api/progress` |
| Programs | `GET/POST /api/programs`, `POST /import`, `POST /{id}/end`, `GET /{id}/overview` |
| Workouts | `GET /api/workouts/today`, `POST /api/workouts/{id}/execute`, `POST /substitute` |
| Strava | `POST /api/strava/sync` |
| Health | `GET /health` |

Persistence: SQLite at `App_Data/training.db`; schema created on demand (no EF migrations in Training stack).

---

## 7. User journeys (web)

### Journey A — First-time visitor (demo)

1. Open app → beta dashboard loads sample week.
2. Review fatigue score and projections.
3. Check off completed workouts; progress persists in SQLite.
4. Optional: create a real plan via wizard.

### Journey B — Create and run a program

1. **Create Workout Plan** → wizard → custom or preset.
2. Log baseline week sessions (manual or Strava).
3. **Generate mesocycle** → status becomes `active_mesocycle`.
4. **Today** tab → start live workout → log sets → save execution.
5. **Plan** tab → review/adjust future weeks.
6. **Programs** → end program when block completes.

---

## 8. Configuration & environments

| Variable | App | Purpose |
|----------|-----|---------|
| `VITE_USE_MOCK_DATA=false` | Web | Use real Training.Api |
| `VITE_API_URL` | Web | Empty in dev (proxy); set for production |
| `EXPO_PUBLIC_API_URL` | Mobile | Empty for web proxy; LAN IP for Expo Go |
| `STRAVA_ACCESS_TOKEN` | Training.Api | Enable Strava sync |
| `CORS_ALLOWED_ORIGINS` | SaaS API | Include `:8081` for Expo web |

---

## 9. Known limitations & technical debt

- **Two backends, two clients** — mobile auth does not gate training API.
- **No JWT on Training.Api** — athlete id is client-supplied.
- **Rich program logic in frontend** — `program.ts` ~2k lines; mesocycle generation is client-side before import.
- **URL-less web routing** — no deep links to Today/Plan; state in React context + localStorage.
- **Mobile feature gap** — planner exists only on web.
- **Mock fallbacks** — web silently falls back to mock data on API errors when not in strict real mode.

---

## 10. Roadmap (design implications)

| Phase | UI impact |
|-------|-----------|
| Mobile planner port | Expo screens mirroring web IA; second API client for `:8080` |
| Unified auth | JWT on training routes or SaaS proxy to training use cases |
| Daily / mesocycle agents | New surfaces for recommendations; consume agent endpoints |
| Additional providers | Same UI patterns; swap Strava mapping for Garmin etc. |

---

## 11. Related documents

- [README.md](../README.md) — run instructions
- [docs/mobile-otp-sign-in.md](./mobile-otp-sign-in.md) — OTP/CORS troubleshooting
- [docs/mobile-auth-storage.md](./mobile-auth-storage.md) — SecureStore web fallback
- [.cursor/rules/architecture-rules.mdc](../.cursor/rules/architecture-rules.mdc) — layer boundaries

---

*This document reflects the codebase as of Phase 1 beta. Update when mobile planner ships or backends merge.*
