using Training.Application.Abstractions;
using Training.Application.Programs;
using Training.Domain.Entities;
using Training.Domain.Enums;
using Training.Domain.ValueObjects;

namespace Training.Application.Services;

public sealed class TrainingProgramService(
    ITrainingProgramRepository trainingProgramRepository,
    IActivityProvider? activityProvider = null) : ITrainingProgramService
{
    public async Task<TrainingProgram> CreateTrainingProgramAsync(
        CreateTrainingProgramCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(command.Name);

        if (command.EndDate is not null && command.EndDate < command.StartDate)
        {
            throw new ArgumentException("Program end date must be on or after the start date.", nameof(command));
        }

        var program = new TrainingProgram(
            Guid.NewGuid(),
            command.Name,
            command.AthleteId,
            command.StartDate,
            command.EndDate,
            []);

        return await trainingProgramRepository.SaveProgramAsync(program, cancellationToken);
    }

    public async Task<Mesocycle> AddMesocycleAsync(
        Guid programId,
        AddMesocycleCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(command.Name);

        if (command.DurationWeeks <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(command), "Duration must be at least one week.");
        }

        await RequireProgramAsync(programId, cancellationToken);

        var mesocycle = new Mesocycle(
            Guid.NewGuid(),
            command.Name,
            command.StartDate,
            command.DurationWeeks,
            []);

        return await trainingProgramRepository.AddMesocycleAsync(programId, mesocycle, cancellationToken);
    }

    public async Task<WeeklyPlan> AddWeeklyPlanAsync(
        Guid programId,
        AddWeeklyPlanCommand command,
        CancellationToken cancellationToken = default)
    {
        if (command.WeekNumber <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(command), "Week number must be greater than zero.");
        }

        await RequireProgramAsync(programId, cancellationToken);

        var weeklyPlan = new WeeklyPlan(Guid.NewGuid(), command.WeekNumber, [], [], [], []);
        return await trainingProgramRepository.AddWeeklyPlanAsync(command.MesocycleId, weeklyPlan, cancellationToken);
    }

    public async Task<WorkoutTemplate> AddWorkoutTemplateAsync(
        Guid programId,
        AddWorkoutTemplateCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(command.Name);
        await RequireProgramAsync(programId, cancellationToken);

        var exercises = command.Exercises
            .Select(exercise => new ExerciseTemplate(
                Guid.NewGuid(),
                RequireText(exercise.ExerciseName, nameof(exercise.ExerciseName)),
                exercise.TargetSets,
                new RepRange(exercise.TargetRepMin, exercise.TargetRepMax),
                exercise.Notes,
                exercise.Category))
            .ToList();
        var workoutTemplate = new WorkoutTemplate(Guid.NewGuid(), command.Name, command.DayOfWeek, exercises);

        return await trainingProgramRepository.AddWorkoutTemplateAsync(
            command.WeeklyPlanId,
            workoutTemplate,
            cancellationToken);
    }

    public async Task<WorkoutExecution> RecordWorkoutExecutionAsync(
        Guid workoutTemplateId,
        RecordWorkoutExecutionCommand command,
        CancellationToken cancellationToken = default)
    {
        var template = await trainingProgramRepository.GetWorkoutTemplateAsync(workoutTemplateId, cancellationToken)
            ?? throw new InvalidOperationException($"Workout template '{workoutTemplateId}' was not found.");
        var templateExercises = template.Exercises.ToDictionary(exercise => exercise.Id);
        var executions = new List<ExerciseExecution>();

        foreach (var exercise in command.Exercises)
        {
            var originalExerciseTemplateId = exercise.OriginalExerciseTemplateId;
            templateExercises.TryGetValue(originalExerciseTemplateId ?? Guid.Empty, out var originalTemplate);
            var originalExerciseName = originalTemplate?.ExerciseName ?? exercise.ExerciseName;
            var isSubstitution = originalTemplate is not null
                && !string.Equals(originalTemplate.ExerciseName, exercise.ExerciseName, StringComparison.OrdinalIgnoreCase);
            ExerciseSubstitution? substitution = null;

            if (isSubstitution || !string.IsNullOrWhiteSpace(exercise.SubstitutionReason))
            {
                substitution = await trainingProgramRepository.UpsertExerciseSubstitutionAsync(
                    new ExerciseSubstitution(
                        Guid.NewGuid(),
                        command.AthleteId,
                        originalExerciseTemplateId,
                        originalExerciseName,
                        RequireText(exercise.ExerciseName, nameof(exercise.ExerciseName)),
                        exercise.SubstitutionReason ?? "Substitution recorded during workout execution.",
                        CleanTags(exercise.ContextTags),
                        SuggestedByUser: true,
                        FrequencyUsed: 1),
                    cancellationToken);
            }

            executions.Add(new ExerciseExecution(
                Guid.NewGuid(),
                originalExerciseTemplateId,
                RequireText(exercise.ExerciseName, nameof(exercise.ExerciseName)),
                exercise.SetsPerformed,
                exercise.RepsPerformed,
                exercise.WeightUsed,
                substitution?.Id,
                exercise.SubstitutionReason));
        }

        var totalVolume = command.TotalVolume ?? CalculateVolume(executions);
        var execution = new WorkoutExecution(
            Guid.NewGuid(),
            command.AthleteId,
            command.Date,
            workoutTemplateId,
            executions,
            WorkoutExecutionSource.Manual,
            command.Duration,
            totalVolume,
            command.Notes,
            ProviderName: null,
            ProviderActivityId: null);

        var saved = await trainingProgramRepository.SaveWorkoutExecutionAsync(execution, cancellationToken);
        await trainingProgramRepository.SaveTrainingLoadSummaryAsync(
            new TrainingLoadSummary(command.AthleteId, command.Date, totalVolume),
            cancellationToken);

        return saved;
    }

    public async Task<ExerciseSubstitution> SubstituteExerciseAsync(
        Guid workoutTemplateId,
        SubstituteExerciseCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(command.SubstitutedExerciseName);
        ArgumentException.ThrowIfNullOrWhiteSpace(command.Reason);

        var template = await trainingProgramRepository.GetWorkoutTemplateAsync(workoutTemplateId, cancellationToken)
            ?? throw new InvalidOperationException($"Workout template '{workoutTemplateId}' was not found.");
        var originalExercise = template.Exercises.FirstOrDefault(exercise => exercise.Id == command.OriginalExerciseTemplateId)
            ?? throw new InvalidOperationException($"Exercise template '{command.OriginalExerciseTemplateId}' was not found.");

        return await trainingProgramRepository.UpsertExerciseSubstitutionAsync(
            new ExerciseSubstitution(
                Guid.NewGuid(),
                command.AthleteId,
                originalExercise.Id,
                originalExercise.ExerciseName,
                command.SubstitutedExerciseName,
                command.Reason,
                CleanTags(command.ContextTags),
                SuggestedByUser: true,
                FrequencyUsed: 1),
            cancellationToken);
    }

    public async Task<WorkoutForDayResult?> GetWorkoutForDayAsync(
        Guid athleteId,
        DateOnly date,
        CancellationToken cancellationToken = default)
    {
        var template = await trainingProgramRepository.GetWorkoutTemplateForDayAsync(athleteId, date, cancellationToken);

        if (template is null)
        {
            return null;
        }

        var substitutionsByExercise = new Dictionary<Guid, IReadOnlyList<ExerciseSubstitution>>();

        foreach (var exercise in template.Exercises)
        {
            substitutionsByExercise[exercise.Id] = await trainingProgramRepository.GetExerciseSubstitutionsAsync(
                athleteId,
                exercise.Id,
                exercise.ExerciseName,
                cancellationToken);
        }

        return new WorkoutForDayResult(date, template, substitutionsByExercise);
    }

    public async Task<IReadOnlyList<WorkoutExecution>> SyncStravaActivitiesAsync(
        SyncStravaActivitiesCommand command,
        CancellationToken cancellationToken = default)
    {
        if (activityProvider is null)
        {
            throw new InvalidOperationException("No activity provider is configured for Strava sync.");
        }

        if (command.To < command.From)
        {
            throw new ArgumentException("Sync end date must be on or after the start date.", nameof(command));
        }

        var activities = await activityProvider.GetActivitiesAsync(
            command.AthleteId,
            command.From,
            command.To,
            cancellationToken);
        var executions = new List<WorkoutExecution>();

        foreach (var activity in activities)
        {
            var date = DateOnly.FromDateTime(activity.StartedAt.UtcDateTime);
            var template = await trainingProgramRepository.GetWorkoutTemplateForDayAsync(
                command.AthleteId,
                date,
                cancellationToken);
            var load = (decimal)Math.Round(activity.Duration.TotalMinutes, 2);
            var execution = new WorkoutExecution(
                Guid.NewGuid(),
                command.AthleteId,
                date,
                template?.Id,
                [],
                WorkoutExecutionSource.Imported,
                activity.Duration,
                load,
                BuildStravaExecutionNotes(activity.Sport, activity.Notes),
                activity.ProviderName,
                activity.ProviderActivityId);

            var saved = await trainingProgramRepository.SaveWorkoutExecutionAsync(execution, cancellationToken);
            await trainingProgramRepository.SaveTrainingLoadSummaryAsync(
                new TrainingLoadSummary(command.AthleteId, date, load),
                cancellationToken);
            executions.Add(saved);
        }

        return executions;
    }

    public Task<TrainingProgramOverview?> GetProgramOverviewAsync(
        Guid programId,
        CancellationToken cancellationToken = default)
    {
        return trainingProgramRepository.GetProgramOverviewAsync(programId, cancellationToken);
    }

    private async Task RequireProgramAsync(Guid programId, CancellationToken cancellationToken)
    {
        _ = await trainingProgramRepository.GetProgramAsync(programId, cancellationToken)
            ?? throw new InvalidOperationException($"Training program '{programId}' was not found.");
    }

    private static decimal CalculateVolume(IEnumerable<ExerciseExecution> executions)
    {
        return executions.Sum(exercise => exercise.SetsPerformed * exercise.RepsPerformed * exercise.WeightUsed);
    }

    private static IReadOnlyList<string> CleanTags(IReadOnlyList<string> tags)
    {
        return tags
            .Where(tag => !string.IsNullOrWhiteSpace(tag))
            .Select(tag => tag.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string RequireText(string value, string name)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value, name);
        return value.Trim();
    }

    private static string? BuildStravaExecutionNotes(string sport, string? notes)
    {
        var trimmedNotes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();
        return trimmedNotes is null ? sport : $"{sport}: {trimmedNotes}";
    }
}
