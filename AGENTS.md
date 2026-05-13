# AGENTS.md

## Cursor Cloud specific instructions

This is a .NET 10 console application (no web UI, no database, no external services).

### Quick reference

| Action | Command |
|---|---|
| Restore | `dotnet restore` |
| Build | `dotnet build` |
| Run | `dotnet run --project src/WorkoutPlanner.Console` |

### Notes

- The .NET 10 SDK is installed via the `dotnet-install.sh` script to `/usr/share/dotnet` with a symlink at `/usr/local/bin/dotnet`. The update script handles this automatically.
- There are no test projects in the repository yet. If tests are added, use `dotnet test` to run them.
- No external services, secrets, or environment variables are required. The app uses an in-memory repository.
- The solution file is at the repo root: `WorkoutPlanner.sln`. All four projects (Domain, Application, Infrastructure, Console) target `net10.0`.
