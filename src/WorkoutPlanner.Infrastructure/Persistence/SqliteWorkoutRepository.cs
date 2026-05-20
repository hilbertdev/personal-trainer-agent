using System.Data;
using System.Globalization;
using Dapper;
using WorkoutPlanner.Domain.Entities;
using WorkoutPlanner.Domain.Enums;
using WorkoutPlanner.Domain.Interfaces;

namespace WorkoutPlanner.Infrastructure.Persistence;

public sealed class SqliteWorkoutRepository(SqliteConnectionFactory connectionFactory) : IWorkoutRepository
{
    private const string DateFormat = "yyyy-MM-dd";

    private readonly SemaphoreSlim _schemaLock = new(1, 1);
    private bool _schemaEnsured;

    public async Task SaveWeeklyPlanAsync(
        IReadOnlyList<WorkoutDay> workouts,
        CancellationToken cancellationToken = default)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "DELETE FROM workout_days;",
                transaction: transaction,
                cancellationToken: cancellationToken));

        foreach (var workout in workouts.OrderBy(workout => workout.Date))
        {
            await SaveWorkoutAsync(connection, transaction, workout, cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<WorkoutDay>> GetCurrentWeekAsync(CancellationToken cancellationToken = default)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = connectionFactory.CreateConnection();
        var workoutRows = (await connection.QueryAsync<WorkoutRow>(
            new CommandDefinition(
                """
                SELECT
                    workout_date AS WorkoutDate,
                    workout_type AS WorkoutType,
                    duration_minutes AS DurationMinutes,
                    intensity AS Intensity,
                    notes AS Notes
                FROM workout_days
                ORDER BY workout_date;
                """,
                cancellationToken: cancellationToken))).ToList();
        var exercisesByDate = await LoadExercisesAsync(connection, cancellationToken);

        return workoutRows
            .Select(row => new WorkoutDay(
                ParseDate(row.WorkoutDate),
                Enum.Parse<WorkoutType>(row.WorkoutType),
                exercisesByDate.GetValueOrDefault(ParseDate(row.WorkoutDate), []),
                (int)row.DurationMinutes,
                Enum.Parse<IntensityLevel>(row.Intensity),
                row.Notes))
            .ToList();
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
                    PRAGMA foreign_keys = ON;

                    CREATE TABLE IF NOT EXISTS workout_days (
                        workout_date TEXT PRIMARY KEY,
                        workout_type TEXT NOT NULL,
                        duration_minutes INTEGER NOT NULL,
                        intensity TEXT NOT NULL,
                        notes TEXT NULL
                    );

                    CREATE TABLE IF NOT EXISTS exercises (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        workout_date TEXT NOT NULL REFERENCES workout_days(workout_date) ON DELETE CASCADE,
                        sort_order INTEGER NOT NULL,
                        name TEXT NOT NULL,
                        sets INTEGER NOT NULL,
                        reps TEXT NOT NULL,
                        rir_or_rpe TEXT NULL
                    );

                    CREATE TABLE IF NOT EXISTS exercise_muscle_groups (
                        exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
                        sort_order INTEGER NOT NULL,
                        muscle_group TEXT NOT NULL,
                        PRIMARY KEY (exercise_id, sort_order)
                    );
                    """,
                    cancellationToken: cancellationToken));

            _schemaEnsured = true;
        }
        finally
        {
            _schemaLock.Release();
        }
    }

    private static async Task SaveWorkoutAsync(
        IDbConnection connection,
        IDbTransaction transaction,
        WorkoutDay workout,
        CancellationToken cancellationToken)
    {
        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                INSERT INTO workout_days (workout_date, workout_type, duration_minutes, intensity, notes)
                VALUES (@WorkoutDate, @WorkoutType, @DurationMinutes, @Intensity, @Notes);
                """,
                new
                {
                    WorkoutDate = FormatDate(workout.Date),
                    WorkoutType = workout.WorkoutType.ToString(),
                    workout.DurationMinutes,
                    Intensity = workout.Intensity.ToString(),
                    workout.Notes
                },
                transaction,
                cancellationToken: cancellationToken));

        for (var exerciseIndex = 0; exerciseIndex < workout.Exercises.Count; exerciseIndex++)
        {
            var exercise = workout.Exercises[exerciseIndex];
            var exerciseId = await connection.ExecuteScalarAsync<long>(
                new CommandDefinition(
                    """
                    INSERT INTO exercises (workout_date, sort_order, name, sets, reps, rir_or_rpe)
                    VALUES (@WorkoutDate, @SortOrder, @Name, @Sets, @Reps, @RirOrRpe)
                    RETURNING id;
                    """,
                    new
                    {
                        WorkoutDate = FormatDate(workout.Date),
                        SortOrder = exerciseIndex,
                        exercise.Name,
                        exercise.Sets,
                        exercise.Reps,
                        exercise.RirOrRpe
                    },
                    transaction,
                    cancellationToken: cancellationToken));

            for (var muscleGroupIndex = 0; muscleGroupIndex < exercise.MuscleGroups.Count; muscleGroupIndex++)
            {
                await connection.ExecuteAsync(
                    new CommandDefinition(
                        """
                        INSERT INTO exercise_muscle_groups (exercise_id, sort_order, muscle_group)
                        VALUES (@ExerciseId, @SortOrder, @MuscleGroup);
                        """,
                        new
                        {
                            ExerciseId = exerciseId,
                            SortOrder = muscleGroupIndex,
                            MuscleGroup = exercise.MuscleGroups[muscleGroupIndex].ToString()
                        },
                        transaction,
                        cancellationToken: cancellationToken));
            }
        }
    }

    private static async Task<IReadOnlyDictionary<DateOnly, IReadOnlyList<Exercise>>> LoadExercisesAsync(
        IDbConnection connection,
        CancellationToken cancellationToken)
    {
        var rows = await connection.QueryAsync<ExerciseRow>(
            new CommandDefinition(
                """
                SELECT
                    e.workout_date AS WorkoutDate,
                    e.name AS Name,
                    e.sets AS Sets,
                    e.reps AS Reps,
                    e.rir_or_rpe AS RirOrRpe,
                    CAST(COALESCE(group_concat(mg.muscle_group, '|'), '') AS TEXT) AS MuscleGroups
                FROM exercises e
                LEFT JOIN exercise_muscle_groups mg ON mg.exercise_id = e.id
                GROUP BY e.id, e.workout_date, e.sort_order, e.name, e.sets, e.reps, e.rir_or_rpe
                ORDER BY e.workout_date, e.sort_order;
                """,
                cancellationToken: cancellationToken));

        var exercisesByDate = new Dictionary<DateOnly, List<Exercise>>();

        foreach (var row in rows)
        {
            var workoutDate = ParseDate(row.WorkoutDate);
            var muscleGroups = string.IsNullOrWhiteSpace(row.MuscleGroups)
                ? []
                : row.MuscleGroups
                    .Split('|', StringSplitOptions.RemoveEmptyEntries)
                    .Select(value => Enum.Parse<MuscleGroup>(value))
                    .ToList();
            var exercise = new Exercise(row.Name, (int)row.Sets, row.Reps, row.RirOrRpe, muscleGroups);

            if (!exercisesByDate.TryGetValue(workoutDate, out var exercises))
            {
                exercises = [];
                exercisesByDate[workoutDate] = exercises;
            }

            exercises.Add(exercise);
        }

        return exercisesByDate.ToDictionary(
            pair => pair.Key,
            pair => (IReadOnlyList<Exercise>)pair.Value);
    }

    private static string FormatDate(DateOnly date)
    {
        return date.ToString(DateFormat, CultureInfo.InvariantCulture);
    }

    private static DateOnly ParseDate(string date)
    {
        return DateOnly.ParseExact(date, DateFormat, CultureInfo.InvariantCulture);
    }

    private sealed class WorkoutRow
    {
        public string WorkoutDate { get; init; } = string.Empty;

        public string WorkoutType { get; init; } = string.Empty;

        public long DurationMinutes { get; init; }

        public string Intensity { get; init; } = string.Empty;

        public string? Notes { get; init; }
    }

    private sealed class ExerciseRow
    {
        public string WorkoutDate { get; init; } = string.Empty;

        public string Name { get; init; } = string.Empty;

        public long Sets { get; init; }

        public string Reps { get; init; } = string.Empty;

        public string? RirOrRpe { get; init; }

        public string MuscleGroups { get; init; } = string.Empty;
    }
}
