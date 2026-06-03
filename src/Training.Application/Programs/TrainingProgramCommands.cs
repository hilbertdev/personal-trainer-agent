using Training.Domain.Enums;

namespace Training.Application.Programs;

public sealed record CreateTrainingProgramCommand(
    string Name,
    Guid AthleteId,
    DateOnly StartDate,
    DateOnly? EndDate);

public sealed record AddMesocycleCommand(
    string Name,
    DateOnly StartDate,
    int DurationWeeks);

public sealed record AddWeeklyPlanCommand(
    Guid MesocycleId,
    int WeekNumber);

public sealed record AddWorkoutTemplateCommand(
    Guid WeeklyPlanId,
    string Name,
    DayOfWeek DayOfWeek,
    IReadOnlyList<ExerciseTemplateInput> Exercises);

public sealed record ExerciseTemplateInput(
    string ExerciseName,
    int TargetSets,
    int TargetRepMin,
    int TargetRepMax,
    string? Notes,
    ExerciseCategory Category);

public sealed record RecordWorkoutExecutionCommand(
    Guid AthleteId,
    DateOnly Date,
    IReadOnlyList<ExerciseExecutionInput> Exercises,
    TimeSpan Duration,
    decimal? TotalVolume,
    string? Notes);

public sealed record ExerciseExecutionInput(
    Guid? OriginalExerciseTemplateId,
    string ExerciseName,
    int SetsPerformed,
    int RepsPerformed,
    decimal WeightUsed,
    string? SubstitutionReason,
    IReadOnlyList<string> ContextTags);

public sealed record SubstituteExerciseCommand(
    Guid AthleteId,
    Guid OriginalExerciseTemplateId,
    string SubstitutedExerciseName,
    string Reason,
    IReadOnlyList<string> ContextTags);

public sealed record SyncStravaActivitiesCommand(
    Guid AthleteId,
    DateOnly From,
    DateOnly To);
