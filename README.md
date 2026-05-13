# personal-trainer-agent
This is a project that will manage all my training and give recommendations daily based on my output

## Workout Planner Phase 1

This repository contains a .NET 10 console MVP for workout fatigue analysis and hypertrophy phase projection.

The app stores workout data in Postgres. Set a connection string before running locally:

```bash
export WORKOUTPLANNER_CONNECTION_STRING="Host=localhost;Port=5432;Database=workout_planner;Username=workout_planner;Password=workout_planner"
```

Run the app from the console project:

```bash
dotnet run --project src/WorkoutPlanner.Console
```

## Agent API

Agents such as OpenClaw can query workout information through the read-only API host:

```bash
dotnet run --project src/WorkoutPlanner.Api
```

Available agent routes:

- `GET /api/agent` - discover agent-oriented workout endpoints and operation ids.
- `GET /api/agent/workouts/current-week` - inspect the current workout week, exercises, volume, and summary.
- `GET /api/agent/workouts/analysis` - retrieve fatigue score, warnings, and recommended rest days.
- `GET /api/agent/workouts/projection` - retrieve the four-week hypertrophy projection.

## Docker

Start Postgres and the API:

```bash
docker compose up --build db api
```

Set `POSTGRES_PORT=5433` (or another open host port) before running compose if local Postgres already uses port 5432.

Run the console planner against the compose Postgres database:

```bash
docker compose run --rm --build console
```

The compose file creates a `workoutplanner-postgres-data` volume so workout rows survive container restarts.
