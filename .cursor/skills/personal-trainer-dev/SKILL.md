---
name: personal-trainer-dev
description: Build, run, and develop the Personal Trainer Agent (.NET 10 backend + Vite/React frontend). Use when setting up the dev environment, running the API/console/frontend, configuring local secrets (.env), or respecting the solution's architecture boundaries.
---

# Personal Trainer Agent — developer guide

A .NET 10 workout planner with a Minimal API + MVC backend, a console entry point, and a Vite + React frontend. Persistence is Dapper + SQLite (no EF Core). The solution file is `Training.sln` at the repo root.

## Quick commands

| Action | Command |
|---|---|
| Restore | `dotnet restore` |
| Build solution | `dotnet build` |
| Run API | `dotnet run --project src/Training.Api` |
| Run console | `dotnet run --project src/Training.Console` |
| Install frontend deps | `npm install --prefix frontend` |
| Run frontend (dev) | `npm run dev --prefix frontend` |
| Build/type-check frontend | `npm run build --prefix frontend` |

There are no test projects yet. If tests are added, run them with `dotnet test`.

## Ports & local wiring

- The API runs in the `Development` environment on `http://localhost:8080` (see `src/Training.Api/Properties/launchSettings.json`).
- The Vite dev server proxies `/api` to `http://localhost:8080` (see `frontend/vite.config.ts`), so leave `VITE_API_URL` empty in dev.
- `GET /health` returns `Healthy` once the API is up.
- Avoid macOS port 5000 (AirPlay/Control Center); the API intentionally uses 8080.

## Local secrets (.env)

The API loads a root `.env` at startup via `LoadLocalEnvFile()` in `src/Training.Api/Program.cs` (using `DotNetEnv`). Real environment variables take precedence, so in production these come from the host (e.g. AWS Secrets Manager) and no `.env` is present.

- Copy `.env.example` → `.env` (gitignored) and fill in values.
- Strava activity sync only activates when `STRAVA_ACCESS_TOKEN` is set. Strava access tokens expire ~6 hours; refresh is not yet wired, so paste a fresh token to test.
- For the frontend, set `frontend/.env.local` (gitignored): `VITE_USE_MOCK_DATA=false`, `VITE_USE_MOCK_STRAVA=false`, `VITE_ATHLETE_ID=<guid>`.

## Database

- Default (Development): SQLite at `App_Data/training.db` (`appsettings.json`). Schema is created on demand by the Dapper repositories — no migrations.
- `appsettings.Production.json` points at `/data/training.db` (the Docker volume); running as Production locally will fail on that read-only path, which is why local runs use Development.
- Override with `TRAINING_SQLITE_CONNECTION_STRING` if needed.

## Docker

`docker-compose up` builds the API (port 8080) and the production frontend (port 3000, nginx proxying `/api`). Use the `mock` profile for a backend-free UI and the `tools` profile for the console.

## Architecture boundaries (must respect)

Layers: `Training.Domain` → `Training.Application` → `Training.Infrastructure` / `Training.Strava` → `Training.Api`. Rules enforced in `.cursor/rules/architecture-rules.mdc`:

- Domain references nothing external (no EF Core, HttpClient, Strava, etc.).
- Application talks only through interfaces (`IActivityProvider`, `ITrainingProgramRepository`, ...).
- No `HttpClient` outside `Training.Strava`; no EF Core anywhere (Dapper only, in `Training.Infrastructure`).
- Controllers stay thin — business logic lives in Domain/Application.
- No Strava types may leave `Training.Strava`; the platform stays provider-agnostic.

When adding features: start with the Domain model, expose a use case in Application, implement persistence in Infrastructure, then add a thin endpoint in `Training.Api`.
