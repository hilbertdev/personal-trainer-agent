---
name: workout-flows
description: Work with Personal Trainer Agent training programs and workouts - create/import a program, fetch today's workout, run the live per-set logging flow, record an execution, and enrich with Strava. Use when building or debugging program, current-workout, or live-workout features across the React frontend and .NET API.
---

# Workout flows (programs, today's workout, live logging, Strava)

How the program and workout experience fits together across the frontend and backend.

## Data models (two that must be reconciled)

- Rich local model (frontend): `frontend/src/lib/program.ts` — `Program → mesocycle.weeks[].days[].workout` with `LoggedExercise[]`. Built by the wizard, persisted to `localStorage` (`pta:active-program`).
- Structured backend model: `TrainingProgram → Mesocycle → WeeklyPlan → WorkoutTemplate → ExerciseTemplate`, plus `WorkoutExecution`/`ExerciseExecution` for completion. Contracts in `src/Training.Api/Contracts/TrainingProgramContracts.cs`.

The wizard generates the local program, then imports it to the backend; the new pages read from the backend. The local copy remains the source of truth for editing/generation.

## Backend endpoints

Programs (`src/Training.Api/Controllers/TrainingProgramsController.cs`):
- `GET /api/programs?athleteId={guid}` — list summaries (active vs archived derived from `EndDate`).
- `POST /api/programs/import` — bulk-create program + mesocycle + weekly plans + workout templates in one call.
- `POST /api/programs/{id}/end` — archive (sets `EndDate`).
- `POST /api/programs`, `POST /api/programs/{id}/mesocycles|weekly-plans|workouts`, `GET /api/programs/{id}/overview` — granular building blocks.

Workouts (`src/Training.Api/Controllers/WorkoutExecutionsController.cs`):
- `GET /api/workouts/today?athleteId={guid}&date={date?}` — today's `WorkoutTemplate`; its `id` is what you execute against.
- `POST /api/workouts/{id}/execute` — record a completed workout (exercise-level aggregates + optional `totalVolume`).
- `POST /api/workouts/{id}/substitute` — record an exercise substitution preference.

Strava (`src/Training.Api/Controllers/StravaSyncController.cs`):
- `POST /api/strava/sync` — import recent Strava activities (returns 400 if no provider configured; needs `STRAVA_ACCESS_TOKEN`).

## Frontend flow

Navigation is tab-based (no router): `frontend/src/nav-context.tsx` + tabs in `app-shell.tsx`, routed in `app-router.tsx`.

- Programs tab → `components/programs-page.tsx` (lists active/archived, open or end).
- Today tab → `components/current-workout-page.tsx` (today's template; "Start workout").
- Plan tab → `components/active-mesocycle-view.tsx` (week-by-week editing).
- Live → `components/live-workout-view.tsx`: walks one exercise at a time, **logs each set separately** (reps + weight per set), shows program/exercise notes, then on finish calls `recordExecution` and offers a Strava sync + manual activity link.

API client + mapping: `frontend/src/lib/training-api.ts` (`listPrograms`, `importProgram`, `endProgram`, `getTodayWorkout`, `recordExecution`). It honors `VITE_API_URL`/`VITE_ATHLETE_ID` and falls back to a localStorage-backed mock when `VITE_USE_MOCK_DATA` is not `false`.

## Key constraints / gotchas

- `WorkoutExecution`/`ExerciseExecution` store aggregates per exercise (sets/reps/weight), not per-set or per-set RPE. The live view logs per set in the UI, then aggregates on submit (avg reps, avg weight, exact summed `totalVolume`) and preserves the per-set breakdown in the execution `notes`. True per-set persistence needs new columns/table.
- Strava enrichment is "sync + manually link an activity"; the backend does not store HR/calories on executions (only `ProviderActivityId`).
- `athleteId` comes from `VITE_ATHLETE_ID` (frontend) and must be a GUID; the backend does not validate athlete existence on program creation.
- Today's-workout lookup matches by program/mesocycle date range, `DayOfWeek`, and week number (`SqliteTrainingProgramRepository.GetWorkoutTemplateForDayAsync`); imported programs start at the current week's Monday so week 1 contains today.
