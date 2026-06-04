using Training.Application.Programs;
using Training.Domain.Entities;
using Training.Domain.Enums;

namespace Training.Api.Contracts;

public sealed record CreateTrainingProgramRequest(
    string Name,
    Guid AthleteId,
    DateOnly StartDate,
    DateOnly? EndDate);

public sealed record AddMesocycleRequest(
    string Name,
    DateOnly StartDate,
    int DurationWeeks);

public sealed record AddWeeklyPlanRequest(
    Guid MesocycleId,
    int WeekNumber);

public sealed record AddWorkoutTemplateRequest(
    Guid WeeklyPlanId,
    string Name,
    DayOfWeek DayOfWeek,
    IReadOnlyList<ExerciseTemplateRequest> Exercises,
    string? WorkoutType,
    string? Description);

public sealed record ExerciseTemplateRequest(
    string ExerciseName,
    string? WarmupSets,
    int TargetSets,
    int TargetRepMin,
    int TargetRepMax,
    string? EarlySetRpe,
    string? LastSetRpe,
    string? RestTime,
    string? LastSetIntensityTechnique,
    string? Notes,
    ExerciseCategory Category,
    IReadOnlyList<string>? Substitutions);

public sealed record RecordWorkoutExecutionRequest(
    Guid AthleteId,
    DateOnly Date,
    IReadOnlyList<ExerciseExecutionRequest> Exercises,
    int DurationMinutes,
    decimal? TotalVolume,
    string? Notes);

public sealed record ExerciseExecutionRequest(
    Guid? OriginalExerciseTemplateId,
    string ExerciseName,
    int SetsPerformed,
    int RepsPerformed,
    decimal WeightUsed,
    string? SubstitutionReason,
    IReadOnlyList<string> ContextTags);

public sealed record SubstituteExerciseRequest(
    Guid AthleteId,
    Guid OriginalExerciseTemplateId,
    string SubstitutedExerciseName,
    string Reason,
    IReadOnlyList<string> ContextTags);

public sealed record SyncStravaActivitiesRequest(
    Guid AthleteId,
    DateOnly From,
    DateOnly To);

public sealed record ImportProgramRequest(
    string Name,
    Guid AthleteId,
    DateOnly StartDate,
    DateOnly? EndDate,
    IReadOnlyList<ImportMesocycleRequest> Mesocycles);

public sealed record ImportMesocycleRequest(
    string Name,
    DateOnly StartDate,
    int DurationWeeks,
    IReadOnlyList<ImportWeeklyPlanRequest> WeeklyPlans);

public sealed record ImportWeeklyPlanRequest(
    int WeekNumber,
    IReadOnlyList<ImportWorkoutTemplateRequest> Workouts);

public sealed record ImportWorkoutTemplateRequest(
    string Name,
    DayOfWeek DayOfWeek,
    IReadOnlyList<ExerciseTemplateRequest> Exercises,
    string? WorkoutType,
    string? Description);

public sealed record EndProgramRequest(DateOnly? EndDate);

public sealed record ProgramSummaryResponse(
    Guid Id,
    string Name,
    Guid AthleteId,
    DateOnly StartDate,
    DateOnly? EndDate,
    bool IsActive,
    int TotalWeeks,
    int CurrentWeek,
    int SessionsPerWeek);

public sealed record TrainingProgramResponse(
    Guid Id,
    string Name,
    Guid AthleteId,
    DateOnly StartDate,
    DateOnly? EndDate,
    IReadOnlyList<MesocycleResponse> Mesocycles);

public sealed record MesocycleResponse(
    Guid Id,
    string Name,
    DateOnly StartDate,
    int DurationWeeks,
    DateOnly EndDate,
    IReadOnlyList<WeeklyPlanResponse> WeeklyPlans);

public sealed record WeeklyPlanResponse(
    Guid Id,
    int WeekNumber,
    IReadOnlyList<WorkoutTemplateResponse> WorkoutTemplates);

public sealed record WorkoutTemplateResponse(
    Guid Id,
    string Name,
    DayOfWeek DayOfWeek,
    IReadOnlyList<ExerciseTemplateResponse> Exercises,
    string? WorkoutType,
    string? Description);

public sealed record ExerciseTemplateResponse(
    Guid Id,
    string ExerciseName,
    string? WarmupSets,
    int TargetSets,
    int TargetRepMin,
    int TargetRepMax,
    string? EarlySetRpe,
    string? LastSetRpe,
    string? RestTime,
    string? LastSetIntensityTechnique,
    string? Notes,
    ExerciseCategory Category,
    IReadOnlyList<ExerciseTemplateSubstitutionResponse> Substitutions);

public sealed record ExerciseTemplateSubstitutionResponse(
    Guid Id,
    string ExerciseName);

public sealed record WorkoutForDayResponse(
    DateOnly Date,
    WorkoutTemplateResponse WorkoutTemplate,
    IReadOnlyList<ExerciseSubstitutionLookupResponse> KnownSubstitutions);

public sealed record WorkoutExecutionResponse(
    Guid Id,
    Guid AthleteId,
    DateOnly Date,
    Guid? WorkoutTemplateId,
    string Source,
    int DurationMinutes,
    decimal TotalVolume,
    string? Notes,
    string? ProviderActivityId,
    IReadOnlyList<ExerciseExecutionResponse> Exercises);

public sealed record ExerciseExecutionResponse(
    Guid Id,
    Guid? OriginalExerciseTemplateId,
    string ExerciseName,
    int SetsPerformed,
    int RepsPerformed,
    decimal WeightUsed,
    Guid? SubstitutionId,
    string? SubstitutionReason);

public sealed record ExerciseSubstitutionResponse(
    Guid Id,
    Guid AthleteId,
    Guid? OriginalExerciseTemplateId,
    string OriginalExerciseName,
    string SubstitutedExerciseName,
    string Reason,
    IReadOnlyList<string> ContextTags,
    bool SuggestedByUser,
    int FrequencyUsed);

public sealed record ExerciseSubstitutionLookupResponse(
    Guid ExerciseTemplateId,
    IReadOnlyList<ExerciseSubstitutionResponse> Substitutions);

public sealed record TrainingLoadSummaryResponse(
    Guid AthleteId,
    DateOnly Date,
    decimal Load);

public sealed record TrainingProgramOverviewResponse(
    TrainingProgramResponse Program,
    IReadOnlyList<WorkoutExecutionResponse> WorkoutExecutions,
    IReadOnlyList<ExerciseSubstitutionResponse> Substitutions,
    IReadOnlyList<TrainingLoadSummaryResponse> TrainingLoadSummaries);

public static class TrainingProgramContractMapper
{
    public static CreateTrainingProgramCommand ToCommand(CreateTrainingProgramRequest request)
    {
        return new CreateTrainingProgramCommand(request.Name, request.AthleteId, request.StartDate, request.EndDate);
    }

    public static AddMesocycleCommand ToCommand(AddMesocycleRequest request)
    {
        return new AddMesocycleCommand(request.Name, request.StartDate, request.DurationWeeks);
    }

    public static AddWeeklyPlanCommand ToCommand(AddWeeklyPlanRequest request)
    {
        return new AddWeeklyPlanCommand(request.MesocycleId, request.WeekNumber);
    }

    public static AddWorkoutTemplateCommand ToCommand(AddWorkoutTemplateRequest request)
    {
        return new AddWorkoutTemplateCommand(
            request.WeeklyPlanId,
            request.Name,
            request.DayOfWeek,
            request.Exercises
                .Select(exercise => new ExerciseTemplateInput(
                    exercise.ExerciseName,
                    exercise.WarmupSets,
                    exercise.TargetSets,
                    exercise.TargetRepMin,
                    exercise.TargetRepMax,
                    exercise.EarlySetRpe,
                    exercise.LastSetRpe,
                    exercise.RestTime,
                    exercise.LastSetIntensityTechnique,
                    exercise.Notes,
                    exercise.Category,
                    exercise.Substitutions))
                .ToList(),
            request.WorkoutType,
            request.Description);
    }

    public static RecordWorkoutExecutionCommand ToCommand(RecordWorkoutExecutionRequest request)
    {
        return new RecordWorkoutExecutionCommand(
            request.AthleteId,
            request.Date,
            request.Exercises
                .Select(exercise => new ExerciseExecutionInput(
                    exercise.OriginalExerciseTemplateId,
                    exercise.ExerciseName,
                    exercise.SetsPerformed,
                    exercise.RepsPerformed,
                    exercise.WeightUsed,
                    exercise.SubstitutionReason,
                    exercise.ContextTags))
                .ToList(),
            TimeSpan.FromMinutes(request.DurationMinutes),
            request.TotalVolume,
            request.Notes);
    }

    public static SubstituteExerciseCommand ToCommand(SubstituteExerciseRequest request)
    {
        return new SubstituteExerciseCommand(
            request.AthleteId,
            request.OriginalExerciseTemplateId,
            request.SubstitutedExerciseName,
            request.Reason,
            request.ContextTags);
    }

    public static SyncStravaActivitiesCommand ToCommand(SyncStravaActivitiesRequest request)
    {
        return new SyncStravaActivitiesCommand(request.AthleteId, request.From, request.To);
    }

    public static ImportProgramCommand ToCommand(ImportProgramRequest request)
    {
        return new ImportProgramCommand(
            request.Name,
            request.AthleteId,
            request.StartDate,
            request.EndDate,
            request.Mesocycles
                .Select(mesocycle => new ImportMesocycleCommand(
                    mesocycle.Name,
                    mesocycle.StartDate,
                    mesocycle.DurationWeeks,
                    mesocycle.WeeklyPlans
                        .Select(weeklyPlan => new ImportWeeklyPlanCommand(
                            weeklyPlan.WeekNumber,
                            weeklyPlan.Workouts
                                .Select(workout => new ImportWorkoutTemplateCommand(
                                    workout.Name,
                                    workout.DayOfWeek,
                                    workout.Exercises.Select(ToInput).ToList(),
                                    workout.WorkoutType,
                                    workout.Description))
                                .ToList()))
                        .ToList()))
                .ToList());
    }

    private static ExerciseTemplateInput ToInput(ExerciseTemplateRequest exercise)
    {
        return new ExerciseTemplateInput(
            exercise.ExerciseName,
            exercise.WarmupSets,
            exercise.TargetSets,
            exercise.TargetRepMin,
            exercise.TargetRepMax,
            exercise.EarlySetRpe,
            exercise.LastSetRpe,
            exercise.RestTime,
            exercise.LastSetIntensityTechnique,
            exercise.Notes,
            exercise.Category,
            exercise.Substitutions);
    }

    public static ProgramSummaryResponse ToSummary(TrainingProgram program)
    {
        var totalWeeks = program.Mesocycles.Sum(mesocycle => mesocycle.DurationWeeks);
        var sessionsPerWeek = program.Mesocycles
            .SelectMany(mesocycle => mesocycle.WeeklyPlans)
            .Select(weeklyPlan => weeklyPlan.WorkoutTemplates.Count)
            .DefaultIfEmpty(0)
            .Max();
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var isActive = program.EndDate is null || program.EndDate >= today;
        var elapsedWeeks = (int)Math.Floor((today.DayNumber - program.StartDate.DayNumber) / 7.0) + 1;
        var currentWeek = totalWeeks <= 0 ? 0 : Math.Clamp(elapsedWeeks, 1, totalWeeks);

        return new ProgramSummaryResponse(
            program.Id,
            program.Name,
            program.AthleteId,
            program.StartDate,
            program.EndDate,
            isActive,
            totalWeeks,
            currentWeek,
            sessionsPerWeek);
    }

    public static TrainingProgramResponse ToResponse(TrainingProgram program)
    {
        return new TrainingProgramResponse(
            program.Id,
            program.Name,
            program.AthleteId,
            program.StartDate,
            program.EndDate,
            program.Mesocycles.Select(ToResponse).ToList());
    }

    public static MesocycleResponse ToResponse(Mesocycle mesocycle)
    {
        return new MesocycleResponse(
            mesocycle.Id,
            mesocycle.Name,
            mesocycle.StartDate,
            mesocycle.DurationWeeks,
            mesocycle.EndDate,
            mesocycle.WeeklyPlans.Select(ToResponse).ToList());
    }

    public static WeeklyPlanResponse ToResponse(WeeklyPlan weeklyPlan)
    {
        return new WeeklyPlanResponse(
            weeklyPlan.Id,
            weeklyPlan.WeekNumber,
            weeklyPlan.WorkoutTemplates.Select(ToResponse).ToList());
    }

    public static WorkoutTemplateResponse ToResponse(WorkoutTemplate workoutTemplate)
    {
        return new WorkoutTemplateResponse(
            workoutTemplate.Id,
            workoutTemplate.Name,
            workoutTemplate.DayOfWeek,
            workoutTemplate.Exercises.Select(ToResponse).ToList(),
            workoutTemplate.WorkoutType,
            workoutTemplate.Description);
    }

    public static ExerciseTemplateResponse ToResponse(ExerciseTemplate exercise)
    {
        return new ExerciseTemplateResponse(
            exercise.Id,
            exercise.ExerciseName,
            exercise.WarmupSets,
            exercise.TargetSets,
            exercise.TargetRepRange.Min,
            exercise.TargetRepRange.Max,
            exercise.EarlySetRpe,
            exercise.LastSetRpe,
            exercise.RestTime,
            exercise.LastSetIntensityTechnique,
            exercise.Notes,
            exercise.Category,
            exercise.Substitutions.Select(ToResponse).ToList());
    }

    public static ExerciseTemplateSubstitutionResponse ToResponse(ExerciseTemplateSubstitution substitution)
    {
        return new ExerciseTemplateSubstitutionResponse(substitution.Id, substitution.ExerciseName);
    }

    public static WorkoutExecutionResponse ToResponse(WorkoutExecution execution)
    {
        return new WorkoutExecutionResponse(
            execution.Id,
            execution.AthleteId,
            execution.Date,
            execution.WorkoutTemplateId,
            execution.Source is WorkoutExecutionSource.Manual
                ? WorkoutExecutionSource.Manual.ToString()
                : execution.ProviderName ?? execution.Source.ToString(),
            (int)Math.Round(execution.Duration.TotalMinutes),
            execution.TotalVolume,
            execution.Notes,
            execution.ProviderActivityId,
            execution.Exercises.Select(ToResponse).ToList());
    }

    public static ExerciseExecutionResponse ToResponse(ExerciseExecution execution)
    {
        return new ExerciseExecutionResponse(
            execution.Id,
            execution.OriginalExerciseTemplateId,
            execution.ExerciseName,
            execution.SetsPerformed,
            execution.RepsPerformed,
            execution.WeightUsed,
            execution.SubstitutionId,
            execution.SubstitutionReason);
    }

    public static ExerciseSubstitutionResponse ToResponse(ExerciseSubstitution substitution)
    {
        return new ExerciseSubstitutionResponse(
            substitution.Id,
            substitution.AthleteId,
            substitution.OriginalExerciseTemplateId,
            substitution.OriginalExerciseName,
            substitution.SubstitutedExerciseName,
            substitution.Reason,
            substitution.ContextTags,
            substitution.SuggestedByUser,
            substitution.FrequencyUsed);
    }

    public static WorkoutForDayResponse ToResponse(WorkoutForDayResult workout)
    {
        return new WorkoutForDayResponse(
            workout.Date,
            ToResponse(workout.WorkoutTemplate),
            workout.SubstitutionsByExerciseTemplateId
                .Select(pair => new ExerciseSubstitutionLookupResponse(
                    pair.Key,
                    pair.Value.Select(ToResponse).ToList()))
                .ToList());
    }

    public static TrainingProgramOverviewResponse ToResponse(TrainingProgramOverview overview)
    {
        return new TrainingProgramOverviewResponse(
            ToResponse(overview.Program),
            overview.WorkoutExecutions.Select(ToResponse).ToList(),
            overview.Substitutions.Select(ToResponse).ToList(),
            overview.TrainingLoadSummaries.Select(ToResponse).ToList());
    }

    public static TrainingLoadSummaryResponse ToResponse(TrainingLoadSummary summary)
    {
        return new TrainingLoadSummaryResponse(summary.AthleteId, summary.Date, summary.Load);
    }
}
