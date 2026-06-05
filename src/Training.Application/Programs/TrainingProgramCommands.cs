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
    IReadOnlyList<ExerciseTemplateInput> Exercises,
    string? WorkoutType,
    string? Description);

public sealed record ExerciseTemplateInput(
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

public sealed record ImportProgramCommand(
    string Name,
    Guid AthleteId,
    DateOnly StartDate,
    DateOnly? EndDate,
    IReadOnlyList<ImportMesocycleCommand> Mesocycles);

public sealed record ImportMesocycleCommand(
    string Name,
    DateOnly StartDate,
    int DurationWeeks,
    IReadOnlyList<ImportWeeklyPlanCommand> WeeklyPlans);

public sealed record ImportWeeklyPlanCommand(
    int WeekNumber,
    IReadOnlyList<ImportWorkoutTemplateCommand> Workouts);

public sealed record ImportWorkoutTemplateCommand(
    string Name,
    DayOfWeek DayOfWeek,
    IReadOnlyList<ExerciseTemplateInput> Exercises,
    string? WorkoutType,
    string? Description);
