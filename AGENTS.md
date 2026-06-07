# AGENTS.md

## Cursor Cloud specific instructions

This is a .NET 10 workout planner with a Minimal API backend, a console entry point, and a Vite + React beta frontend.

### Quick reference

| Action | Command |
|---|---|
| Restore | `dotnet restore` |
| Build | `dotnet build` |
| Run | `dotnet run --project src/Training.Console` |
| Run API | `dotnet run --project src/Training.Api` |
| Run frontend | `npm install --prefix frontend && npm run dev --prefix frontend` |
| Run all backend tests | `dotnet test` |
| Run backend unit tests | `dotnet test tests/Training.Domain.Tests tests/Training.Application.Tests tests/Training.Strava.Tests` (run one project per command) |
| Run SQLite integration tests | `dotnet test tests/Training.Infrastructure.Tests --filter "Category=Integration"` |
| Run Postgres integration tests (Docker) | `dotnet test tests/Training.Infrastructure.Tests --filter "Category=Postgres"` |
| Run API integration tests | `dotnet test tests/Training.Api.IntegrationTests --filter "Category=Integration"` |
| Run frontend tests | `npm test --prefix frontend` |
| Frontend test coverage | `npm run test:coverage --prefix frontend` |

### Notes

- The .NET 10 SDK is installed via the `dotnet-install.sh` script to `/usr/share/dotnet` with a symlink at `/usr/local/bin/dotnet`. The update script handles this automatically.
- Test projects live under `tests/` (Domain, Application, Infrastructure, Strava, Api integration). Frontend uses Vitest + React Testing Library.
- Postgres integration tests require Docker (Testcontainers). SQLite and API integration tests run without Docker.
- No external services or secrets are required for Phase 1 beta. The API and console default to SQLite at `App_Data/training.db`.
- The solution file is at the repo root: `Training.sln`. The .NET projects (Domain, Application, Infrastructure, Console, API) target `net10.0`.
