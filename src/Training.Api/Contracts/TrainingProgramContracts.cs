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
    IReadOnlyList<ExerciseTemplateRequest> Exercises);

public sealed record ExerciseTemplateRequest(
    string ExerciseName,
    int TargetSets,
    int TargetRepMin,
    int TargetRepMax,
    string? Notes,
    ExerciseCategory Category);

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
    IReadOnlyList<ExerciseTemplateResponse> Exercises);

public sealed record ExerciseTemplateResponse(
    Guid Id,
    string ExerciseName,
    int TargetSets,
    int TargetRepMin,
    int TargetRepMax,
    string? Notes,
    ExerciseCategory Category);

public sealed record WorkoutForDayResponse(
    DateOnly Date,
    WorkoutTemplateResponse WorkoutTemplate,
    IReadOnlyList<ExerciseSubstitutionLookupResponse> KnownSubstitutions);

public sealed record WorkoutExecutionResponse(
    Guid Id,
    Guid AthleteId,
    DateOnly Date,
    Guid? WorkoutTemplateId,
    WorkoutExecutionSource Source,
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
                    exercise.TargetSets,
                    exercise.TargetRepMin,
                    exercise.TargetRepMax,
                    exercise.Notes,
                    exercise.Category))
                .ToList());
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
            workoutTemplate.Exercises.Select(ToResponse).ToList());
    }

    public static ExerciseTemplateResponse ToResponse(ExerciseTemplate exercise)
    {
        return new ExerciseTemplateResponse(
            exercise.Id,
            exercise.ExerciseName,
            exercise.TargetSets,
            exercise.TargetRepRange.Min,
            exercise.TargetRepRange.Max,
            exercise.Notes,
            exercise.Category);
    }

    public static WorkoutExecutionResponse ToResponse(WorkoutExecution execution)
    {
        return new WorkoutExecutionResponse(
            execution.Id,
            execution.AthleteId,
            execution.Date,
            execution.WorkoutTemplateId,
            execution.Source,
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
