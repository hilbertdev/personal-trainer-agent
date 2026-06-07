# Mobile Responsiveness Audit Report

Audit date: June 7, 2026  
Scope: Entire `frontend/src` React application (28 TS/TSX files)

## Pages Audited

| Route / View | Component | Shell |
|---|---|---|
| No active program (demo) | `BetaDashboard` | Own layout |
| Baseline week collection | `BaselineWeekView` | `AppShell` |
| Programs list | `ProgramsPage` | `AppShell` |
| Today's workout | `CurrentWorkoutPage` | `AppShell` |
| Live workout logging | `LiveWorkoutView` | Full-page (from Today) |
| Active mesocycle plan | `ActiveMesocycleView` | `AppShell` |
| Create plan wizard (modal) | `CreatePlanWizard` | Global overlay |
| Log workout (modal) | `LogWorkoutModal` | Overlay |
| Strava mapping (modal) | `StravaMappingModal` | Overlay |

## Components Updated

### New
- `components/mobile-nav-drawer.tsx` — hamburger trigger + slide-out drawer
- `components/ui/input.tsx` — shared `inputClassName`, `selectClassName`, `textareaClassName`, `Input`, `Textarea`

### Layout & Navigation
- `components/app-shell.tsx`
- `components/beta-dashboard.tsx` (Shell header)

### UI Primitives
- `components/ui/button.tsx`
- `components/ui/modal.tsx`
- `components/ui/checkbox.tsx`
- `app/globals.css`

### Pages
- `components/baseline-week-view.tsx`
- `components/active-mesocycle-view.tsx`
- `components/programs-page.tsx`
- `components/current-workout-page.tsx`
- `components/live-workout-view.tsx`

### Modals & Forms
- `components/create-plan-wizard.tsx`
- `components/log-workout-modal.tsx`
- `components/strava-mapping-modal.tsx`

## Responsiveness Issues Found & Fixes Applied

### Navigation
| File | Problem | Fix |
|---|---|---|
| `app-shell.tsx` | Tab nav hidden on mobile with no alternative | Added hamburger menu + right slide-out drawer (`MobileNavDrawer`) for Programs / Today / Plan |
| `app-shell.tsx` | Desktop-only tab pills too small | Increased tab `min-h-11`; desktop tabs hidden below `md`, drawer shown instead |

### Typography
| File | Problem | Fix |
|---|---|---|
| `app-shell.tsx`, `beta-dashboard.tsx` | `text-4xl sm:text-5xl` headings too large on 320px | Mobile-first scale: `text-2xl md:text-3xl lg:text-4xl xl:text-5xl` |
| `beta-dashboard.tsx` | Hero `text-3xl sm:text-6xl` jump | `text-2xl sm:text-3xl lg:text-4xl xl:text-6xl` |
| `beta-dashboard.tsx`, `baseline-week-view.tsx`, `active-mesocycle-view.tsx` | Metric headings `text-5xl` on small screens | `text-3xl sm:text-4xl lg:text-5xl` |
| `programs-page.tsx`, `current-workout-page.tsx` | Page titles oversized on mobile | `text-2xl md:text-3xl lg:text-4xl` |

### Grids & Layout
| File | Problem | Fix |
|---|---|---|
| `programs-page.tsx` | `grid-cols-3` stats cramped at 320px | `grid-cols-1 sm:grid-cols-3` |
| `programs-page.tsx` | Header actions overflow | Stack header; full-width Create button on mobile |
| `beta-dashboard.tsx` | Projection grid started at `md:grid-cols-2` | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` |
| `active-mesocycle-view.tsx` | Week day cards started at `md:grid-cols-2` | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` |
| `create-plan-wizard.tsx` | Mesocycle length `grid-cols-2` cramped | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| `log-workout-modal.tsx` | Session/exercise field grids too dense | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4/5` |
| `live-workout-view.tsx` | Set logging grid could clip on narrow screens | Wrapped in `overflow-x-auto` with `min-w-[16rem]` |

### Touch Targets (44px minimum)
| File | Problem | Fix |
|---|---|---|
| `ui/button.tsx` | `sm` size was `h-9` (36px) | `min-h-11`; default `min-h-12`; icon `h-11 w-11` |
| `ui/checkbox.tsx` | Checkbox `h-6 w-6` | Increased to `h-11 w-11` |
| `ui/modal.tsx` | Close button ~32px | `h-11 w-11` touch target |
| `active-mesocycle-view.tsx` | Edit icon `p-2` only | `h-11 w-11` button |
| `live-workout-view.tsx` | Remove set `h-9 w-9` | `h-11 w-11` |
| `log-workout-modal.tsx` | Remove exercise icon too small | `h-11 w-11` |
| `create-plan-wizard.tsx`, `log-workout-modal.tsx` | Chip/pill buttons `py-1` | `min-h-11 py-2` |

### Forms & Inputs
| File | Problem | Fix |
|---|---|---|
| Multiple modals | Inconsistent input heights (~36px) | Centralized `inputClassName` with `min-h-12` (mobile), `min-h-11` (sm+) |
| `live-workout-view.tsx` | Local input styles | Uses shared `inputClassName` |
| `strava-mapping-modal.tsx` | Select too short | Uses `selectClassName` |

### Modals
| File | Problem | Fix |
|---|---|---|
| `ui/modal.tsx` | Mobile sheet height not safe-area aware | `max-h` uses `dvh` + safe-area insets; scrollable body with `min-h-0` |
| `ui/modal.tsx` | Title fixed at `text-xl` | `text-lg sm:text-xl` |
| Wizard / log / Strava modals | Footer buttons side-by-side on 320px | Stack footers on mobile (`flex-col-reverse`), full-width buttons |

### Global / Capacitor readiness
| File | Problem | Fix |
|---|---|---|
| `globals.css` | No safe-area support | Added horizontal safe-area padding on body |
| `app-shell.tsx`, `beta-dashboard.tsx` | Bottom content near home indicator | `pb-[max(1rem,env(safe-area-inset-bottom))]` |

## Validation

- `npm test` — 12/12 passing
- `npm run build` — successful (TypeScript + Vite)

Recommended manual checks in browser DevTools at: **320, 375, 390, 414, 768, 820, 1024, 1280, 1440** px.

## Remaining Issues (Manual Design Decisions)

1. **Baseline week has no tab nav** — Only one AppShell view during baseline collection; no mobile drawer needed unless future tabs are added (e.g. Settings).
2. **Beta dashboard duplicate header** — Demo mode uses its own Shell without app tabs; acceptable for standalone demo but could be unified later.
3. **Live workout set grid on 320px** — Uses horizontal scroll inside the card as a fallback; a stacked card-per-set layout would be more thumb-friendly but requires a larger UX redesign.
4. **No automated visual regression** — Responsive behavior is validated by build/tests only; consider Playwright viewport snapshots for CI.
5. **Charts** — No chart components in the current frontend; N/A for this audit.

## Success Criteria Status

| Criterion | Status |
|---|---|
| Mobile-first Tailwind breakpoints | Done |
| No required page-level horizontal scroll (320px+) | Done |
| 44px tap targets on primary controls | Done |
| Mobile navigation drawer | Done (active mesocycle) |
| Desktop experience preserved | Done |
| Modal mobile sheet + scroll | Done |
| Capacitor safe-area ready | Partial (CSS env insets added) |
