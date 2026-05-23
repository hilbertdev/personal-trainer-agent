# personal-trainer-agent
This is a project that will manage all my training and give recommendations daily based on my output

## Phase 1 beta

This beta keeps the existing Clean Architecture backend and adds only the launch surface needed to validate demand quickly:

- `WorkoutPlanner.Domain` remains pure domain entities, enums, and interfaces.
- `WorkoutPlanner.Application` keeps fatigue analysis, recovery heuristics, hypertrophy projections, and planning rules.
- `WorkoutPlanner.Infrastructure` provides lightweight SQLite persistence.
- `WorkoutPlanner.Api` is the ASP.NET Core Minimal API composition root.
- `frontend/` is a static-friendly Vite + React TypeScript app for Vercel.

The app defaults to SQLite at `App_Data/workoutplanner.db`, so beta hosting can start near $0/month without a managed database.

## Recommended folder structure

```text
src/
  WorkoutPlanner.Domain/          # Pure entities, enums, interfaces
  WorkoutPlanner.Application/     # FatigueAnalyzer, HypertrophyPhaseScheduler, WorkoutPlanningService
  WorkoutPlanner.Infrastructure/  # SQLite repositories and sample data
  WorkoutPlanner.Api/             # Minimal API, CORS, Swagger, health checks
  WorkoutPlanner.Console/         # CLI entry point using the same services
frontend/                         # Vite + React + TypeScript + Tailwind + shadcn-style UI
Dockerfile.api                    # Backend container
docker-compose.yml                # Local API + SQLite volume
fly.toml                          # Cheap backend deployment config
```

## Local development

Copy environment defaults:

```bash
cp .env.example .env
```

Restore and build the .NET solution:

```bash
dotnet restore
dotnet build
```

Run the API:

```bash
dotnet run --project src/WorkoutPlanner.Api
```

Run the frontend:

```bash
cd frontend
npm install
VITE_API_URL=http://localhost:8080 npm run dev
```

Swagger UI is available at `http://localhost:8080/swagger`.

## API endpoints

Beta endpoints:

- `GET /health` - health check for hosts and containers.
- `GET /api/workouts/sample` - returns sample weekly workout data from `SampleWorkoutDataFactory`.
- `POST /api/workouts/analyze` - accepts weekly workout data, calls `IWorkoutPlanningService`, and returns fatigue analysis, projected hypertrophy weeks, recommendations, and warnings.
- `GET /api/progress` - returns completed workouts persisted in SQLite.
- `POST /api/progress` - stores a completed workout in SQLite.

Existing agent discovery endpoints remain available:

- `GET /api/agent`
- `GET /api/agent/workouts/current-week`
- `GET /api/agent/workouts/analysis`
- `GET /api/agent/workouts/projection`

## Docker

Start the API with a persistent SQLite volume:

```bash
docker compose up --build api
```

Run the console planner against the same SQLite volume:

```bash
docker compose run --rm --build console
```

The compose file creates a `workoutplanner-sqlite-data` volume so workout and progress rows survive container restarts.

## Frontend features

- Dashboard with current week, fatigue score, recovery status, progress bar, completed workout count, warnings, and recommendations.
- Workout planner cards with completion checkboxes and expandable exercise details.
- Four-week hypertrophy projection tabs.
- Mobile-first responsive layout with dark mode.
- API integration through `fetch` + React Query using `VITE_API_URL`.

The frontend does not contain fatigue-analysis business logic; it renders the API response.

## Cheapest beta hosting recommendation

Use:

- Backend: Fly.io with Docker + a tiny persistent volume for SQLite (`fly.toml` is included).
- Frontend: Vercel free tier from `frontend/`.

This avoids Kubernetes, managed Postgres, auth providers, and paid infrastructure while still giving HTTPS, health checks, CI/CD-friendly deploys, and a persistent beta database.

## Exact beta deployment steps

### 1. Deploy the backend to Fly.io

```bash
fly auth login
fly apps create personal-trainer-agent-api
fly volumes create workoutplanner_data --size 1 --region iad
fly secrets set CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
fly deploy
fly status
fly checks list
```

The API URL will look like:

```text
https://personal-trainer-agent-api.fly.dev
```

### 2. Deploy the frontend to Vercel

```bash
cd frontend
vercel link
vercel env add VITE_API_URL production
# value: https://personal-trainer-agent-api.fly.dev
vercel deploy --prod
```

Or connect the repository in the Vercel dashboard:

- Root directory: `frontend`
- Framework preset: Vite
- Environment variable: `VITE_API_URL=https://personal-trainer-agent-api.fly.dev`

### 3. Validate the beta

```bash
curl https://personal-trainer-agent-api.fly.dev/health
curl https://personal-trainer-agent-api.fly.dev/api/workouts/sample
```

Open the Vercel URL on desktop and mobile, complete a workout, refresh, and confirm progress remains checked.
