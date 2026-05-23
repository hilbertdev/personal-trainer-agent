# AGENTS.md

## Cursor Cloud specific instructions

This is a .NET 10 workout planner with a Minimal API backend, a console entry point, and a Vite + React beta frontend.

### Quick reference

| Action | Command |
|---|---|
| Restore | `dotnet restore` |
| Build | `dotnet build` |
| Run | `dotnet run --project src/WorkoutPlanner.Console` |
| Run API | `dotnet run --project src/WorkoutPlanner.Api` |
| Run frontend | `npm install --prefix frontend && npm run dev --prefix frontend` |

### Notes

- The .NET 10 SDK is installed via the `dotnet-install.sh` script to `/usr/share/dotnet` with a symlink at `/usr/local/bin/dotnet`. The update script handles this automatically.
- There are no test projects in the repository yet. If tests are added, use `dotnet test` to run them.
- No external services or secrets are required for Phase 1 beta. The API and console default to SQLite at `App_Data/workoutplanner.db`.
- The solution file is at the repo root: `WorkoutPlanner.sln`. The .NET projects (Domain, Application, Infrastructure, Console, API) target `net10.0`.
