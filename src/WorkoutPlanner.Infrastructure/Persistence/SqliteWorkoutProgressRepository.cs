using System.Globalization;
using Dapper;
using WorkoutPlanner.Domain.Entities;
using WorkoutPlanner.Domain.Enums;
using WorkoutPlanner.Domain.Interfaces;

namespace WorkoutPlanner.Infrastructure.Persistence;

public sealed class SqliteWorkoutProgressRepository(SqliteConnectionFactory connectionFactory) : IWorkoutProgressRepository
{
    private const string DateFormat = "yyyy-MM-dd";

    private readonly SemaphoreSlim _schemaLock = new(1, 1);
    private bool _schemaEnsured;

    public async Task<CompletedWorkout> SaveCompletedWorkoutAsync(
        CompletedWorkout completedWorkout,
        CancellationToken cancellationToken = default)
    {
        await EnsureSchemaAsync(cancellationToken);

        var workout = completedWorkout.Id == Guid.Empty
            ? completedWorkout with { Id = Guid.NewGuid() }
            : completedWorkout;
        var completedAt = workout.CompletedAt == default
            ? DateTimeOffset.UtcNow
            : workout.CompletedAt.ToUniversalTime();

        workout = workout with { CompletedAt = completedAt };

        await using var connection = connectionFactory.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                INSERT INTO completed_workouts (id, workout_date, workout_type, completed_at, notes)
                VALUES (@Id, @WorkoutDate, @WorkoutType, @CompletedAt, @Notes)
                ON CONFLICT(id) DO UPDATE SET
                    workout_date = excluded.workout_date,
                    workout_type = excluded.workout_type,
                    completed_at = excluded.completed_at,
                    notes = excluded.notes;
                """,
                new
                {
                    Id = workout.Id.ToString(),
                    WorkoutDate = FormatDate(workout.WorkoutDate),
                    WorkoutType = workout.WorkoutType.ToString(),
                    CompletedAt = workout.CompletedAt.ToString("O", CultureInfo.InvariantCulture),
                    workout.Notes
                },
                cancellationToken: cancellationToken));

        return workout;
    }

    public async Task<WorkoutProgress> GetProgressAsync(CancellationToken cancellationToken = default)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<CompletedWorkoutRow>(
            new CommandDefinition(
                """
                SELECT
                    id AS Id,
                    workout_date AS WorkoutDate,
                    workout_type AS WorkoutType,
                    completed_at AS CompletedAt,
                    notes AS Notes
                FROM completed_workouts
                ORDER BY workout_date DESC, completed_at DESC;
                """,
                cancellationToken: cancellationToken));
        var completedWorkouts = rows
            .Select(row => new CompletedWorkout(
                Guid.Parse(row.Id),
                DateOnly.ParseExact(row.WorkoutDate, DateFormat, CultureInfo.InvariantCulture),
                Enum.Parse<WorkoutType>(row.WorkoutType),
                DateTimeOffset.Parse(row.CompletedAt, CultureInfo.InvariantCulture),
                row.Notes))
            .ToList();

        return new WorkoutProgress(completedWorkouts);
    }

    private async Task EnsureSchemaAsync(CancellationToken cancellationToken)
    {
        if (_schemaEnsured)
        {
            return;
        }

        await _schemaLock.WaitAsync(cancellationToken);

        try
        {
            if (_schemaEnsured)
            {
                return;
            }

            await using var connection = connectionFactory.CreateConnection();
            await connection.ExecuteAsync(
                new CommandDefinition(
                    """
                    CREATE TABLE IF NOT EXISTS user_plans (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        week_start_date TEXT NOT NULL,
                        created_at TEXT NOT NULL
                    );

                    CREATE TABLE IF NOT EXISTS completed_workouts (
                        id TEXT PRIMARY KEY,
                        workout_date TEXT NOT NULL,
                        workout_type TEXT NOT NULL,
                        completed_at TEXT NOT NULL,
                        notes TEXT NULL
                    );

                    INSERT INTO user_plans (id, name, week_start_date, created_at)
                    SELECT @PlanId, @Name, @WeekStartDate, @CreatedAt
                    WHERE NOT EXISTS (SELECT 1 FROM user_plans);
                    """,
                    new
                    {
                        PlanId = Guid.NewGuid().ToString(),
                        Name = "Phase 1 Beta Plan",
                        WeekStartDate = FormatDate(DateOnly.FromDateTime(DateTime.UtcNow.Date)),
                        CreatedAt = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture)
                    },
                    cancellationToken: cancellationToken));

            _schemaEnsured = true;
        }
        finally
        {
            _schemaLock.Release();
        }
    }

    private static string FormatDate(DateOnly date)
    {
        return date.ToString(DateFormat, CultureInfo.InvariantCulture);
    }

    private sealed record CompletedWorkoutRow(
        string Id,
        string WorkoutDate,
        string WorkoutType,
        string CompletedAt,
        string? Notes);
}
