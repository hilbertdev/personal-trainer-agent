using System.Data;
using System.Globalization;
using Dapper;
using Training.Application.Abstractions;
using Training.Domain.Entities;
using Training.Domain.Enums;
using Training.Domain.ValueObjects;

namespace Training.Infrastructure.Persistence;

public sealed class SqliteTrainingProgramRepository(SqliteConnectionFactory connectionFactory) : ITrainingProgramRepository
{
    private const string DateFormat = "yyyy-MM-dd";

    private readonly SemaphoreSlim _schemaLock = new(1, 1);
    private bool _schemaEnsured;

    public async Task<TrainingProgram> SaveProgramAsync(
        TrainingProgram program,
        CancellationToken cancellationToken = default)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = connectionFactory.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                INSERT INTO training_programs (id, name, athlete_id, start_date, end_date)
                VALUES (@Id, @Name, @AthleteId, @StartDate, @EndDate)
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    athlete_id = excluded.athlete_id,
                    start_date = excluded.start_date,
                    end_date = excluded.end_date;
                """,
                new
                {
                    Id = program.Id.ToString(),
                    program.Name,
                    AthleteId = program.AthleteId.ToString(),
                    StartDate = FormatDate(program.StartDate),
                    EndDate = program.EndDate is null ? null : FormatDate(program.EndDate.Value)
                },
                cancellationToken: cancellationToken));

        return program;
    }

    public async Task<Mesocycle> AddMesocycleAsync(
        Guid programId,
        Mesocycle mesocycle,
        CancellationToken cancellationToken = default)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = connectionFactory.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                INSERT INTO mesocycles (id, program_id, name, start_date, duration_weeks)
                VALUES (@Id, @ProgramId, @Name, @StartDate, @DurationWeeks);
                """,
                new
                {
                    Id = mesocycle.Id.ToString(),
                    ProgramId = programId.ToString(),
                    mesocycle.Name,
                    StartDate = FormatDate(mesocycle.StartDate),
                    mesocycle.DurationWeeks
                },
                cancellationToken: cancellationToken));

        return mesocycle;
    }

    public async Task<WeeklyPlan> AddWeeklyPlanAsync(
        Guid mesocycleId,
        WeeklyPlan weeklyPlan,
        CancellationToken cancellationToken = default)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = connectionFactory.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                INSERT INTO weekly_plans (id, mesocycle_id, week_number)
                VALUES (@Id, @MesocycleId, @WeekNumber);
                """,
                new
                {
                    Id = weeklyPlan.Id.ToString(),
                    MesocycleId = mesocycleId.ToString(),
                    weeklyPlan.WeekNumber
                },
                cancellationToken: cancellationToken));

        return weeklyPlan;
    }

    public async Task<WorkoutTemplate> AddWorkoutTemplateAsync(
        Guid weeklyPlanId,
        WorkoutTemplate workoutTemplate,
        CancellationToken cancellationToken = default)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                INSERT INTO workout_templates (id, weekly_plan_id, name, day_of_week)
                VALUES (@Id, @WeeklyPlanId, @Name, @DayOfWeek);
                """,
                new
                {
                    Id = workoutTemplate.Id.ToString(),
                    WeeklyPlanId = weeklyPlanId.ToString(),
                    workoutTemplate.Name,
                    DayOfWeek = workoutTemplate.DayOfWeek.ToString()
                },
                transaction,
                cancellationToken: cancellationToken));

        for (var index = 0; index < workoutTemplate.Exercises.Count; index++)
        {
            var exercise = workoutTemplate.Exercises[index];
            await connection.ExecuteAsync(
                new CommandDefinition(
                    """
                    INSERT INTO exercise_templates (
                        id,
                        workout_template_id,
                        sort_order,
                        exercise_name,
                        target_sets,
                        target_rep_min,
                        target_rep_max,
                        notes,
                        category)
                    VALUES (
                        @Id,
                        @WorkoutTemplateId,
                        @SortOrder,
                        @ExerciseName,
                        @TargetSets,
                        @TargetRepMin,
                        @TargetRepMax,
                        @Notes,
                        @Category);
                    """,
                    new
                    {
                        Id = exercise.Id.ToString(),
                        WorkoutTemplateId = workoutTemplate.Id.ToString(),
                        SortOrder = index,
                        exercise.ExerciseName,
                        exercise.TargetSets,
                        TargetRepMin = exercise.TargetRepRange.Min,
                        TargetRepMax = exercise.TargetRepRange.Max,
                        exercise.Notes,
                        Category = exercise.Category.ToString()
                    },
                    transaction,
                    cancellationToken: cancellationToken));
        }

        await transaction.CommitAsync(cancellationToken);
        return workoutTemplate;
    }

    public async Task<TrainingProgram?> GetProgramAsync(
        Guid programId,
        CancellationToken cancellationToken = default)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = connectionFactory.CreateConnection();
        return await LoadProgramAsync(connection, programId, cancellationToken);
    }

    public async Task<TrainingProgramOverview?> GetProgramOverviewAsync(
        Guid programId,
        CancellationToken cancellationToken = default)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = connectionFactory.CreateConnection();
        var program = await LoadProgramAsync(connection, programId, cancellationToken);

        if (program is null)
        {
            return null;
        }

        var executions = await LoadWorkoutExecutionsAsync(
            connection,
            program.AthleteId,
            program.StartDate,
            program.EndDate,
            cancellationToken);
        var substitutions = await LoadSubstitutionsForAthleteAsync(connection, program.AthleteId, cancellationToken);
        var loadSummaries = await LoadLoadSummariesAsync(
            connection,
            program.AthleteId,
            program.StartDate,
            program.EndDate,
            cancellationToken);

        return new TrainingProgramOverview(program, executions, substitutions, loadSummaries);
    }

    public async Task<WorkoutTemplate?> GetWorkoutTemplateAsync(
        Guid workoutTemplateId,
        CancellationToken cancellationToken = default)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = connectionFactory.CreateConnection();
        return await LoadWorkoutTemplateAsync(connection, workoutTemplateId, cancellationToken);
    }

    public async Task<WorkoutTemplate?> GetWorkoutTemplateForDayAsync(
        Guid athleteId,
        DateOnly date,
        CancellationToken cancellationToken = default)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = connectionFactory.CreateConnection();
        var row = await connection.QuerySingleOrDefaultAsync<WorkoutTemplateLookupRow>(
            new CommandDefinition(
                """
                SELECT
                    wt.id AS Id,
                    wp.week_number AS WeekNumber,
                    m.start_date AS MesocycleStartDate
                FROM workout_templates wt
                INNER JOIN weekly_plans wp ON wp.id = wt.weekly_plan_id
                INNER JOIN mesocycles m ON m.id = wp.mesocycle_id
                INNER JOIN training_programs p ON p.id = m.program_id
                WHERE p.athlete_id = @AthleteId
                  AND p.start_date <= @WorkoutDate
                  AND (p.end_date IS NULL OR p.end_date >= @WorkoutDate)
                  AND m.start_date <= @WorkoutDate
                  AND date(m.start_date, printf('+%d days', (m.duration_weeks * 7) - 1)) >= @WorkoutDate
                  AND wt.day_of_week = @DayOfWeek
                ORDER BY p.start_date DESC, m.start_date DESC, wp.week_number ASC;
                """,
                new
                {
                    AthleteId = athleteId.ToString(),
                    WorkoutDate = FormatDate(date),
                    DayOfWeek = date.DayOfWeek.ToString()
                },
                cancellationToken: cancellationToken));

        if (row is null)
        {
            return null;
        }

        var weekNumber = ((date.DayNumber - ParseDate(row.MesocycleStartDate).DayNumber) / 7) + 1;
        var templateId = row.WeekNumber == weekNumber
            ? Guid.Parse(row.Id)
            : await FindFallbackWorkoutTemplateIdAsync(connection, athleteId, date, weekNumber, cancellationToken);

        return templateId is null
            ? null
            : await LoadWorkoutTemplateAsync(connection, templateId.Value, cancellationToken);
    }

    public async Task<IReadOnlyList<ExerciseSubstitution>> GetExerciseSubstitutionsAsync(
        Guid athleteId,
        Guid? originalExerciseTemplateId,
        string originalExerciseName,
        CancellationToken cancellationToken = default)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<ExerciseSubstitutionRow>(
            new CommandDefinition(
                """
                SELECT
                    id AS Id,
                    athlete_id AS AthleteId,
                    original_exercise_template_id AS OriginalExerciseTemplateId,
                    original_exercise_name AS OriginalExerciseName,
                    substituted_exercise_name AS SubstitutedExerciseName,
                    reason AS Reason,
                    context_tags AS ContextTags,
                    suggested_by_user AS SuggestedByUser,
                    frequency_used AS FrequencyUsed
                FROM exercise_substitutions
                WHERE athlete_id = @AthleteId
                  AND (
                    (@OriginalExerciseTemplateId IS NOT NULL AND original_exercise_template_id = @OriginalExerciseTemplateId)
                    OR lower(original_exercise_name) = lower(@OriginalExerciseName)
                  )
                ORDER BY frequency_used DESC, substituted_exercise_name;
                """,
                new
                {
                    AthleteId = athleteId.ToString(),
                    OriginalExerciseTemplateId = originalExerciseTemplateId?.ToString(),
                    OriginalExerciseName = originalExerciseName
                },
                cancellationToken: cancellationToken));

        return rows.Select(ToSubstitution).ToList();
    }

    public async Task<ExerciseSubstitution> UpsertExerciseSubstitutionAsync(
        ExerciseSubstitution substitution,
        CancellationToken cancellationToken = default)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = connectionFactory.CreateConnection();
        var existing = await FindExistingSubstitutionAsync(connection, substitution, cancellationToken);

        if (existing is not null)
        {
            var updated = substitution with
            {
                Id = existing.Id,
                FrequencyUsed = existing.FrequencyUsed + Math.Max(1, substitution.FrequencyUsed)
            };
            await connection.ExecuteAsync(
                new CommandDefinition(
                    """
                    UPDATE exercise_substitutions
                    SET reason = @Reason,
                        context_tags = @ContextTags,
                        suggested_by_user = @SuggestedByUser,
                        frequency_used = @FrequencyUsed
                    WHERE id = @Id;
                    """,
                    new
                    {
                        Id = updated.Id.ToString(),
                        updated.Reason,
                        ContextTags = FormatTags(updated.ContextTags),
                        SuggestedByUser = updated.SuggestedByUser ? 1 : 0,
                        updated.FrequencyUsed
                    },
                    cancellationToken: cancellationToken));

            return updated;
        }

        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                INSERT INTO exercise_substitutions (
                    id,
                    athlete_id,
                    original_exercise_template_id,
                    original_exercise_name,
                    substituted_exercise_name,
                    reason,
                    context_tags,
                    suggested_by_user,
                    frequency_used)
                VALUES (
                    @Id,
                    @AthleteId,
                    @OriginalExerciseTemplateId,
                    @OriginalExerciseName,
                    @SubstitutedExerciseName,
                    @Reason,
                    @ContextTags,
                    @SuggestedByUser,
                    @FrequencyUsed);
                """,
                new
                {
                    Id = substitution.Id.ToString(),
                    AthleteId = substitution.AthleteId.ToString(),
                    OriginalExerciseTemplateId = substitution.OriginalExerciseTemplateId?.ToString(),
                    substitution.OriginalExerciseName,
                    substitution.SubstitutedExerciseName,
                    substitution.Reason,
                    ContextTags = FormatTags(substitution.ContextTags),
                    SuggestedByUser = substitution.SuggestedByUser ? 1 : 0,
                    FrequencyUsed = Math.Max(1, substitution.FrequencyUsed)
                },
                cancellationToken: cancellationToken));

        return substitution with { FrequencyUsed = Math.Max(1, substitution.FrequencyUsed) };
    }

    public async Task<WorkoutExecution> SaveWorkoutExecutionAsync(
        WorkoutExecution execution,
        CancellationToken cancellationToken = default)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        var executionId = await connection.ExecuteScalarAsync<string>(
            new CommandDefinition(
                """
                INSERT INTO workout_executions (
                    id,
                    athlete_id,
                    workout_date,
                    workout_template_id,
                    source,
                    duration_seconds,
                    total_volume,
                    notes,
                    provider_activity_id)
                VALUES (
                    @Id,
                    @AthleteId,
                    @WorkoutDate,
                    @WorkoutTemplateId,
                    @Source,
                    @DurationSeconds,
                    @TotalVolume,
                    @Notes,
                    @ProviderActivityId)
                ON CONFLICT(provider_activity_id) DO UPDATE SET
                    athlete_id = excluded.athlete_id,
                    workout_date = excluded.workout_date,
                    workout_template_id = excluded.workout_template_id,
                    source = excluded.source,
                    duration_seconds = excluded.duration_seconds,
                    total_volume = excluded.total_volume,
                    notes = excluded.notes
                RETURNING id;
                """,
                new
                {
                    Id = execution.Id.ToString(),
                    AthleteId = execution.AthleteId.ToString(),
                    WorkoutDate = FormatDate(execution.Date),
                    WorkoutTemplateId = execution.WorkoutTemplateId?.ToString(),
                    Source = execution.Source.ToString(),
                    DurationSeconds = (long)execution.Duration.TotalSeconds,
                    execution.TotalVolume,
                    execution.Notes,
                    execution.ProviderActivityId
                },
                transaction,
                cancellationToken: cancellationToken));
        var savedExecutionId = Guid.Parse(executionId
            ?? throw new DataException("Saving workout execution did not return an execution id."));

        await connection.ExecuteAsync(
            new CommandDefinition(
                "DELETE FROM exercise_executions WHERE workout_execution_id = @ExecutionId;",
                new { ExecutionId = savedExecutionId.ToString() },
                transaction,
                cancellationToken: cancellationToken));

        for (var index = 0; index < execution.Exercises.Count; index++)
        {
            var exercise = execution.Exercises[index];
            await connection.ExecuteAsync(
                new CommandDefinition(
                    """
                    INSERT INTO exercise_executions (
                        id,
                        workout_execution_id,
                        sort_order,
                        original_exercise_template_id,
                        exercise_name,
                        sets_performed,
                        reps_performed,
                        weight_used,
                        substitution_id,
                        substitution_reason)
                    VALUES (
                        @Id,
                        @WorkoutExecutionId,
                        @SortOrder,
                        @OriginalExerciseTemplateId,
                        @ExerciseName,
                        @SetsPerformed,
                        @RepsPerformed,
                        @WeightUsed,
                        @SubstitutionId,
                        @SubstitutionReason);
                    """,
                    new
                    {
                        Id = exercise.Id.ToString(),
                        WorkoutExecutionId = savedExecutionId.ToString(),
                        SortOrder = index,
                        OriginalExerciseTemplateId = exercise.OriginalExerciseTemplateId?.ToString(),
                        exercise.ExerciseName,
                        exercise.SetsPerformed,
                        exercise.RepsPerformed,
                        exercise.WeightUsed,
                        SubstitutionId = exercise.SubstitutionId?.ToString(),
                        exercise.SubstitutionReason
                    },
                    transaction,
                    cancellationToken: cancellationToken));
        }

        await transaction.CommitAsync(cancellationToken);
        return execution with { Id = savedExecutionId };
    }

    public async Task SaveTrainingLoadSummaryAsync(
        TrainingLoadSummary summary,
        CancellationToken cancellationToken = default)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = connectionFactory.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                INSERT INTO training_load_summaries (athlete_id, load_date, load_value)
                VALUES (@AthleteId, @LoadDate, @LoadValue)
                ON CONFLICT(athlete_id, load_date) DO UPDATE SET
                    load_value = training_load_summaries.load_value + excluded.load_value;
                """,
                new
                {
                    AthleteId = summary.AthleteId.ToString(),
                    LoadDate = FormatDate(summary.Date),
                    LoadValue = summary.Load
                },
                cancellationToken: cancellationToken));
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

                    CREATE TABLE IF NOT EXISTS training_programs (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        athlete_id TEXT NOT NULL,
                        start_date TEXT NOT NULL,
                        end_date TEXT NULL
                    );

                    CREATE TABLE IF NOT EXISTS mesocycles (
                        id TEXT PRIMARY KEY,
                        program_id TEXT NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
                        name TEXT NOT NULL,
                        start_date TEXT NOT NULL,
                        duration_weeks INTEGER NOT NULL
                    );

                    CREATE TABLE IF NOT EXISTS weekly_plans (
                        id TEXT PRIMARY KEY,
                        mesocycle_id TEXT NOT NULL REFERENCES mesocycles(id) ON DELETE CASCADE,
                        week_number INTEGER NOT NULL,
                        UNIQUE(mesocycle_id, week_number)
                    );

                    CREATE TABLE IF NOT EXISTS workout_templates (
                        id TEXT PRIMARY KEY,
                        weekly_plan_id TEXT NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
                        name TEXT NOT NULL,
                        day_of_week TEXT NOT NULL
                    );

                    CREATE TABLE IF NOT EXISTS exercise_templates (
                        id TEXT PRIMARY KEY,
                        workout_template_id TEXT NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
                        sort_order INTEGER NOT NULL,
                        exercise_name TEXT NOT NULL,
                        target_sets INTEGER NOT NULL,
                        target_rep_min INTEGER NOT NULL,
                        target_rep_max INTEGER NOT NULL,
                        notes TEXT NULL,
                        category TEXT NOT NULL
                    );

                    CREATE TABLE IF NOT EXISTS exercise_substitutions (
                        id TEXT PRIMARY KEY,
                        athlete_id TEXT NOT NULL,
                        original_exercise_template_id TEXT NULL,
                        original_exercise_name TEXT NOT NULL,
                        substituted_exercise_name TEXT NOT NULL,
                        reason TEXT NOT NULL,
                        context_tags TEXT NOT NULL,
                        suggested_by_user INTEGER NOT NULL,
                        frequency_used INTEGER NOT NULL
                    );

                    CREATE TABLE IF NOT EXISTS workout_executions (
                        id TEXT PRIMARY KEY,
                        athlete_id TEXT NOT NULL,
                        workout_date TEXT NOT NULL,
                        workout_template_id TEXT NULL REFERENCES workout_templates(id) ON DELETE SET NULL,
                        source TEXT NOT NULL,
                        duration_seconds INTEGER NOT NULL,
                        total_volume NUMERIC NOT NULL,
                        notes TEXT NULL,
                        provider_activity_id TEXT NULL UNIQUE
                    );

                    CREATE TABLE IF NOT EXISTS exercise_executions (
                        id TEXT PRIMARY KEY,
                        workout_execution_id TEXT NOT NULL REFERENCES workout_executions(id) ON DELETE CASCADE,
                        sort_order INTEGER NOT NULL,
                        original_exercise_template_id TEXT NULL REFERENCES exercise_templates(id) ON DELETE SET NULL,
                        exercise_name TEXT NOT NULL,
                        sets_performed INTEGER NOT NULL,
                        reps_performed INTEGER NOT NULL,
                        weight_used NUMERIC NOT NULL,
                        substitution_id TEXT NULL REFERENCES exercise_substitutions(id) ON DELETE SET NULL,
                        substitution_reason TEXT NULL
                    );

                    CREATE TABLE IF NOT EXISTS training_load_summaries (
                        athlete_id TEXT NOT NULL,
                        load_date TEXT NOT NULL,
                        load_value NUMERIC NOT NULL,
                        PRIMARY KEY (athlete_id, load_date)
                    );

                    CREATE INDEX IF NOT EXISTS idx_training_programs_athlete_dates
                        ON training_programs(athlete_id, start_date, end_date);
                    CREATE INDEX IF NOT EXISTS idx_exercise_substitutions_lookup
                        ON exercise_substitutions(athlete_id, original_exercise_template_id, original_exercise_name, substituted_exercise_name);
                    CREATE INDEX IF NOT EXISTS idx_workout_executions_athlete_date
                        ON workout_executions(athlete_id, workout_date);
                    """,
                    cancellationToken: cancellationToken));

            _schemaEnsured = true;
        }
        finally
        {
            _schemaLock.Release();
        }
    }

    private static async Task<TrainingProgram?> LoadProgramAsync(
        IDbConnection connection,
        Guid programId,
        CancellationToken cancellationToken)
    {
        var programRow = await connection.QuerySingleOrDefaultAsync<TrainingProgramRow>(
            new CommandDefinition(
                """
                SELECT
                    id AS Id,
                    name AS Name,
                    athlete_id AS AthleteId,
                    start_date AS StartDate,
                    end_date AS EndDate
                FROM training_programs
                WHERE id = @ProgramId;
                """,
                new { ProgramId = programId.ToString() },
                cancellationToken: cancellationToken));

        if (programRow is null)
        {
            return null;
        }

        var mesocycles = await LoadMesocyclesAsync(connection, programId, cancellationToken);

        return new TrainingProgram(
            Guid.Parse(programRow.Id),
            programRow.Name,
            Guid.Parse(programRow.AthleteId),
            ParseDate(programRow.StartDate),
            string.IsNullOrWhiteSpace(programRow.EndDate) ? null : ParseDate(programRow.EndDate),
            mesocycles);
    }

    private static async Task<IReadOnlyList<Mesocycle>> LoadMesocyclesAsync(
        IDbConnection connection,
        Guid programId,
        CancellationToken cancellationToken)
    {
        var rows = await connection.QueryAsync<MesocycleRow>(
            new CommandDefinition(
                """
                SELECT
                    id AS Id,
                    name AS Name,
                    start_date AS StartDate,
                    duration_weeks AS DurationWeeks
                FROM mesocycles
                WHERE program_id = @ProgramId
                ORDER BY start_date, id;
                """,
                new { ProgramId = programId.ToString() },
                cancellationToken: cancellationToken));
        var mesocycles = new List<Mesocycle>();

        foreach (var row in rows)
        {
            var mesocycleId = Guid.Parse(row.Id);
            var weeklyPlans = await LoadWeeklyPlansAsync(connection, mesocycleId, cancellationToken);
            mesocycles.Add(new Mesocycle(
                mesocycleId,
                row.Name,
                ParseDate(row.StartDate),
                (int)row.DurationWeeks,
                weeklyPlans));
        }

        return mesocycles;
    }

    private static async Task<IReadOnlyList<WeeklyPlan>> LoadWeeklyPlansAsync(
        IDbConnection connection,
        Guid mesocycleId,
        CancellationToken cancellationToken)
    {
        var rows = await connection.QueryAsync<WeeklyPlanRow>(
            new CommandDefinition(
                """
                SELECT
                    id AS Id,
                    week_number AS WeekNumber
                FROM weekly_plans
                WHERE mesocycle_id = @MesocycleId
                ORDER BY week_number;
                """,
                new { MesocycleId = mesocycleId.ToString() },
                cancellationToken: cancellationToken));
        var weeklyPlans = new List<WeeklyPlan>();

        foreach (var row in rows)
        {
            var weeklyPlanId = Guid.Parse(row.Id);
            var workoutTemplates = await LoadWorkoutTemplatesForWeeklyPlanAsync(
                connection,
                weeklyPlanId,
                cancellationToken);
            weeklyPlans.Add(new WeeklyPlan(weeklyPlanId, (int)row.WeekNumber, workoutTemplates, [], [], []));
        }

        return weeklyPlans;
    }

    private static async Task<IReadOnlyList<WorkoutTemplate>> LoadWorkoutTemplatesForWeeklyPlanAsync(
        IDbConnection connection,
        Guid weeklyPlanId,
        CancellationToken cancellationToken)
    {
        var rows = await connection.QueryAsync<WorkoutTemplateRow>(
            new CommandDefinition(
                """
                SELECT
                    id AS Id,
                    name AS Name,
                    day_of_week AS DayOfWeek
                FROM workout_templates
                WHERE weekly_plan_id = @WeeklyPlanId
                ORDER BY
                    CASE day_of_week
                        WHEN 'Monday' THEN 1
                        WHEN 'Tuesday' THEN 2
                        WHEN 'Wednesday' THEN 3
                        WHEN 'Thursday' THEN 4
                        WHEN 'Friday' THEN 5
                        WHEN 'Saturday' THEN 6
                        ELSE 7
                    END,
                    name;
                """,
                new { WeeklyPlanId = weeklyPlanId.ToString() },
                cancellationToken: cancellationToken));
        var templates = new List<WorkoutTemplate>();

        foreach (var row in rows)
        {
            templates.Add(await ToWorkoutTemplateAsync(connection, row, cancellationToken));
        }

        return templates;
    }

    private static async Task<WorkoutTemplate?> LoadWorkoutTemplateAsync(
        IDbConnection connection,
        Guid workoutTemplateId,
        CancellationToken cancellationToken)
    {
        var row = await connection.QuerySingleOrDefaultAsync<WorkoutTemplateRow>(
            new CommandDefinition(
                """
                SELECT
                    id AS Id,
                    name AS Name,
                    day_of_week AS DayOfWeek
                FROM workout_templates
                WHERE id = @WorkoutTemplateId;
                """,
                new { WorkoutTemplateId = workoutTemplateId.ToString() },
                cancellationToken: cancellationToken));

        return row is null
            ? null
            : await ToWorkoutTemplateAsync(connection, row, cancellationToken);
    }

    private static async Task<WorkoutTemplate> ToWorkoutTemplateAsync(
        IDbConnection connection,
        WorkoutTemplateRow row,
        CancellationToken cancellationToken)
    {
        var exercises = await LoadExerciseTemplatesAsync(connection, Guid.Parse(row.Id), cancellationToken);

        return new WorkoutTemplate(
            Guid.Parse(row.Id),
            row.Name,
            Enum.Parse<DayOfWeek>(row.DayOfWeek),
            exercises);
    }

    private static async Task<IReadOnlyList<ExerciseTemplate>> LoadExerciseTemplatesAsync(
        IDbConnection connection,
        Guid workoutTemplateId,
        CancellationToken cancellationToken)
    {
        var rows = await connection.QueryAsync<ExerciseTemplateRow>(
            new CommandDefinition(
                """
                SELECT
                    id AS Id,
                    exercise_name AS ExerciseName,
                    target_sets AS TargetSets,
                    target_rep_min AS TargetRepMin,
                    target_rep_max AS TargetRepMax,
                    notes AS Notes,
                    category AS Category
                FROM exercise_templates
                WHERE workout_template_id = @WorkoutTemplateId
                ORDER BY sort_order;
                """,
                new { WorkoutTemplateId = workoutTemplateId.ToString() },
                cancellationToken: cancellationToken));

        return rows
            .Select(row => new ExerciseTemplate(
                Guid.Parse(row.Id),
                row.ExerciseName,
                (int)row.TargetSets,
                new RepRange((int)row.TargetRepMin, (int)row.TargetRepMax),
                row.Notes,
                Enum.Parse<ExerciseCategory>(row.Category)))
            .ToList();
    }

    private static async Task<Guid?> FindFallbackWorkoutTemplateIdAsync(
        IDbConnection connection,
        Guid athleteId,
        DateOnly date,
        int weekNumber,
        CancellationToken cancellationToken)
    {
        var id = await connection.QuerySingleOrDefaultAsync<string>(
            new CommandDefinition(
                """
                SELECT wt.id
                FROM workout_templates wt
                INNER JOIN weekly_plans wp ON wp.id = wt.weekly_plan_id
                INNER JOIN mesocycles m ON m.id = wp.mesocycle_id
                INNER JOIN training_programs p ON p.id = m.program_id
                WHERE p.athlete_id = @AthleteId
                  AND p.start_date <= @WorkoutDate
                  AND (p.end_date IS NULL OR p.end_date >= @WorkoutDate)
                  AND m.start_date <= @WorkoutDate
                  AND date(m.start_date, printf('+%d days', (m.duration_weeks * 7) - 1)) >= @WorkoutDate
                  AND wt.day_of_week = @DayOfWeek
                ORDER BY
                    CASE
                        WHEN wp.week_number = @WeekNumber THEN 0
                        WHEN wp.week_number = 1 THEN 1
                        ELSE 2
                    END,
                    wp.week_number
                LIMIT 1;
                """,
                new
                {
                    AthleteId = athleteId.ToString(),
                    WorkoutDate = FormatDate(date),
                    DayOfWeek = date.DayOfWeek.ToString(),
                    WeekNumber = weekNumber
                },
                cancellationToken: cancellationToken));

        return string.IsNullOrWhiteSpace(id) ? null : Guid.Parse(id);
    }

    private static async Task<ExerciseSubstitution?> FindExistingSubstitutionAsync(
        IDbConnection connection,
        ExerciseSubstitution substitution,
        CancellationToken cancellationToken)
    {
        var row = await connection.QuerySingleOrDefaultAsync<ExerciseSubstitutionRow>(
            new CommandDefinition(
                """
                SELECT
                    id AS Id,
                    athlete_id AS AthleteId,
                    original_exercise_template_id AS OriginalExerciseTemplateId,
                    original_exercise_name AS OriginalExerciseName,
                    substituted_exercise_name AS SubstitutedExerciseName,
                    reason AS Reason,
                    context_tags AS ContextTags,
                    suggested_by_user AS SuggestedByUser,
                    frequency_used AS FrequencyUsed
                FROM exercise_substitutions
                WHERE athlete_id = @AthleteId
                  AND lower(substituted_exercise_name) = lower(@SubstitutedExerciseName)
                  AND (
                    (@OriginalExerciseTemplateId IS NOT NULL AND original_exercise_template_id = @OriginalExerciseTemplateId)
                    OR lower(original_exercise_name) = lower(@OriginalExerciseName)
                  )
                LIMIT 1;
                """,
                new
                {
                    AthleteId = substitution.AthleteId.ToString(),
                    OriginalExerciseTemplateId = substitution.OriginalExerciseTemplateId?.ToString(),
                    substitution.OriginalExerciseName,
                    substitution.SubstitutedExerciseName
                },
                cancellationToken: cancellationToken));

        return row is null ? null : ToSubstitution(row);
    }

    private static async Task<IReadOnlyList<ExerciseSubstitution>> LoadSubstitutionsForAthleteAsync(
        IDbConnection connection,
        Guid athleteId,
        CancellationToken cancellationToken)
    {
        var rows = await connection.QueryAsync<ExerciseSubstitutionRow>(
            new CommandDefinition(
                """
                SELECT
                    id AS Id,
                    athlete_id AS AthleteId,
                    original_exercise_template_id AS OriginalExerciseTemplateId,
                    original_exercise_name AS OriginalExerciseName,
                    substituted_exercise_name AS SubstitutedExerciseName,
                    reason AS Reason,
                    context_tags AS ContextTags,
                    suggested_by_user AS SuggestedByUser,
                    frequency_used AS FrequencyUsed
                FROM exercise_substitutions
                WHERE athlete_id = @AthleteId
                ORDER BY frequency_used DESC, original_exercise_name, substituted_exercise_name;
                """,
                new { AthleteId = athleteId.ToString() },
                cancellationToken: cancellationToken));

        return rows.Select(ToSubstitution).ToList();
    }

    private static async Task<IReadOnlyList<WorkoutExecution>> LoadWorkoutExecutionsAsync(
        IDbConnection connection,
        Guid athleteId,
        DateOnly startDate,
        DateOnly? endDate,
        CancellationToken cancellationToken)
    {
        var rows = await connection.QueryAsync<WorkoutExecutionRow>(
            new CommandDefinition(
                """
                SELECT
                    id AS Id,
                    athlete_id AS AthleteId,
                    workout_date AS WorkoutDate,
                    workout_template_id AS WorkoutTemplateId,
                    source AS Source,
                    duration_seconds AS DurationSeconds,
                    total_volume AS TotalVolume,
                    notes AS Notes,
                    provider_activity_id AS ProviderActivityId
                FROM workout_executions
                WHERE athlete_id = @AthleteId
                  AND workout_date >= @StartDate
                  AND (@EndDate IS NULL OR workout_date <= @EndDate)
                ORDER BY workout_date, id;
                """,
                new
                {
                    AthleteId = athleteId.ToString(),
                    StartDate = FormatDate(startDate),
                    EndDate = endDate is null ? null : FormatDate(endDate.Value)
                },
                cancellationToken: cancellationToken));
        var executions = new List<WorkoutExecution>();

        foreach (var row in rows)
        {
            var id = Guid.Parse(row.Id);
            var exercises = await LoadExerciseExecutionsAsync(connection, id, cancellationToken);
            executions.Add(new WorkoutExecution(
                id,
                Guid.Parse(row.AthleteId),
                ParseDate(row.WorkoutDate),
                string.IsNullOrWhiteSpace(row.WorkoutTemplateId) ? null : Guid.Parse(row.WorkoutTemplateId),
                exercises,
                Enum.Parse<WorkoutExecutionSource>(row.Source),
                TimeSpan.FromSeconds(row.DurationSeconds),
                row.TotalVolume,
                row.Notes,
                row.ProviderActivityId));
        }

        return executions;
    }

    private static async Task<IReadOnlyList<ExerciseExecution>> LoadExerciseExecutionsAsync(
        IDbConnection connection,
        Guid workoutExecutionId,
        CancellationToken cancellationToken)
    {
        var rows = await connection.QueryAsync<ExerciseExecutionRow>(
            new CommandDefinition(
                """
                SELECT
                    id AS Id,
                    original_exercise_template_id AS OriginalExerciseTemplateId,
                    exercise_name AS ExerciseName,
                    sets_performed AS SetsPerformed,
                    reps_performed AS RepsPerformed,
                    weight_used AS WeightUsed,
                    substitution_id AS SubstitutionId,
                    substitution_reason AS SubstitutionReason
                FROM exercise_executions
                WHERE workout_execution_id = @WorkoutExecutionId
                ORDER BY sort_order;
                """,
                new { WorkoutExecutionId = workoutExecutionId.ToString() },
                cancellationToken: cancellationToken));

        return rows
            .Select(row => new ExerciseExecution(
                Guid.Parse(row.Id),
                string.IsNullOrWhiteSpace(row.OriginalExerciseTemplateId) ? null : Guid.Parse(row.OriginalExerciseTemplateId),
                row.ExerciseName,
                (int)row.SetsPerformed,
                (int)row.RepsPerformed,
                row.WeightUsed,
                string.IsNullOrWhiteSpace(row.SubstitutionId) ? null : Guid.Parse(row.SubstitutionId),
                row.SubstitutionReason))
            .ToList();
    }

    private static async Task<IReadOnlyList<TrainingLoadSummary>> LoadLoadSummariesAsync(
        IDbConnection connection,
        Guid athleteId,
        DateOnly startDate,
        DateOnly? endDate,
        CancellationToken cancellationToken)
    {
        var rows = await connection.QueryAsync<TrainingLoadSummaryRow>(
            new CommandDefinition(
                """
                SELECT
                    athlete_id AS AthleteId,
                    load_date AS LoadDate,
                    load_value AS LoadValue
                FROM training_load_summaries
                WHERE athlete_id = @AthleteId
                  AND load_date >= @StartDate
                  AND (@EndDate IS NULL OR load_date <= @EndDate)
                ORDER BY load_date;
                """,
                new
                {
                    AthleteId = athleteId.ToString(),
                    StartDate = FormatDate(startDate),
                    EndDate = endDate is null ? null : FormatDate(endDate.Value)
                },
                cancellationToken: cancellationToken));

        return rows
            .Select(row => new TrainingLoadSummary(Guid.Parse(row.AthleteId), ParseDate(row.LoadDate), row.LoadValue))
            .ToList();
    }

    private static ExerciseSubstitution ToSubstitution(ExerciseSubstitutionRow row)
    {
        return new ExerciseSubstitution(
            Guid.Parse(row.Id),
            Guid.Parse(row.AthleteId),
            string.IsNullOrWhiteSpace(row.OriginalExerciseTemplateId) ? null : Guid.Parse(row.OriginalExerciseTemplateId),
            row.OriginalExerciseName,
            row.SubstitutedExerciseName,
            row.Reason,
            ParseTags(row.ContextTags),
            row.SuggestedByUser is not 0,
            (int)row.FrequencyUsed);
    }

    private static string FormatTags(IReadOnlyList<string> tags)
    {
        return string.Join("|", tags.Select(tag => tag.Replace("|", string.Empty, StringComparison.Ordinal)));
    }

    private static IReadOnlyList<string> ParseTags(string tags)
    {
        return string.IsNullOrWhiteSpace(tags)
            ? []
            : tags.Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }

    private static string FormatDate(DateOnly date)
    {
        return date.ToString(DateFormat, CultureInfo.InvariantCulture);
    }

    private static DateOnly ParseDate(string date)
    {
        return DateOnly.ParseExact(date, DateFormat, CultureInfo.InvariantCulture);
    }

    private sealed record TrainingProgramRow(
        string Id,
        string Name,
        string AthleteId,
        string StartDate,
        string? EndDate);

    private sealed record MesocycleRow(
        string Id,
        string Name,
        string StartDate,
        long DurationWeeks);

    private sealed record WeeklyPlanRow(
        string Id,
        long WeekNumber);

    private sealed record WorkoutTemplateRow(
        string Id,
        string Name,
        string DayOfWeek);

    private sealed record WorkoutTemplateLookupRow(
        string Id,
        long WeekNumber,
        string MesocycleStartDate);

    private sealed record ExerciseTemplateRow(
        string Id,
        string ExerciseName,
        long TargetSets,
        long TargetRepMin,
        long TargetRepMax,
        string? Notes,
        string Category);

    private sealed record ExerciseSubstitutionRow(
        string Id,
        string AthleteId,
        string? OriginalExerciseTemplateId,
        string OriginalExerciseName,
        string SubstitutedExerciseName,
        string Reason,
        string ContextTags,
        long SuggestedByUser,
        long FrequencyUsed);

    private sealed record WorkoutExecutionRow(
        string Id,
        string AthleteId,
        string WorkoutDate,
        string? WorkoutTemplateId,
        string Source,
        long DurationSeconds,
        decimal TotalVolume,
        string? Notes,
        string? ProviderActivityId);

    private sealed record ExerciseExecutionRow(
        string Id,
        string? OriginalExerciseTemplateId,
        string ExerciseName,
        long SetsPerformed,
        long RepsPerformed,
        decimal WeightUsed,
        string? SubstitutionId,
        string? SubstitutionReason);

    private sealed record TrainingLoadSummaryRow(
        string AthleteId,
        string LoadDate,
        decimal LoadValue);
}
