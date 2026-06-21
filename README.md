# personal-trainer-agent
This is a project that will manage all my training and give recommendations daily based on my output

## Phase 1 beta

This beta uses Onion Architecture so the platform models training concepts while external data providers stay replaceable:

- `Training.Domain` remains pure training domain entities, value objects, and enums.
- `Training.Application` keeps use cases, provider contracts, fatigue analysis, recovery heuristics, hypertrophy projections, and planning rules.
- `Training.Infrastructure` provides lightweight SQLite persistence behind Application contracts.
- `Training.Strava` translates Strava HTTP/OAuth concepts into provider-neutral Application models.
- `Training.Api` exposes thin API and agent endpoints.
- `frontend/` is a static-friendly Vite + React TypeScript app for Vercel.

The app defaults to SQLite at `App_Data/training.db`, so beta hosting can start near $0/month without a managed database.

## QBS SaaS backend

A production-oriented SaaS API scaffolded with [QBS Dev Kit](https://github.com/Quantabridges-Solutions/qbs-dev-kit) lives under `src/backend/`:

- **PersonalTrainer.Api** — thin controllers, JWT, health checks, Scalar docs
- **PersonalTrainer.Application** — DTOs and service contracts (Traditional Services)
- **PersonalTrainer.Domain** — multi-tenant entities
- **PersonalTrainer.Infrastructure** — EF Core + PostgreSQL, Redis cache, OTP auth

Run locally with Postgres + Redis:

```bash
docker compose -f docker-compose.saas.yml up
```

See `src/backend/README.md` for API endpoints and migration commands.

## Mobile (Expo)

React Native app under `src/mobile/` with Expo Router, OTP auth, and SecureStore token storage.

```bash
cd src/mobile
cp .env.example .env
npm install
npm start
```

See `src/mobile/README.md` for simulator API URLs and EAS build instructions.

## Recommended folder structure

```text
src/
  Training.Domain/          # Pure training entities and enums
  Training.Application/     # Use cases, ports, providers, fatigue/recovery planning
  Training.Infrastructure/  # SQLite repositories and infrastructure modules
  Training.Strava/          # Strava HTTP/OAuth integration and provider adapters
  Training.Api/             # Minimal API, CORS, Swagger, health checks
  Training.Console/         # CLI entry point using the same services
frontend/                         # Vite + React + TypeScript + Tailwind + shadcn-style UI
Dockerfile.api                    # Backend container
docker-compose.yml                # Local API + frontend + SQLite volume
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
dotnet run --project src/Training.Api
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

Start the API and frontend (nginx serves the UI on port 3000 and proxies `/api` to the backend):

```bash
docker compose up --build
```

- UI: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:8080](http://localhost:8080) (Swagger at `/swagger`)

Mock-only frontend (no API container):

```bash
docker compose --profile mock up --build frontend-mock
```

API only with a persistent SQLite volume:

```bash
docker compose up --build api
```

Run the console planner against the same SQLite volume:

```bash
docker compose run --rm --build console
```

The compose file creates a `workout-planner-sqlite` volume so workout and progress rows survive container restarts.

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
fly volumes create training_data --size 1 --region iad
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
