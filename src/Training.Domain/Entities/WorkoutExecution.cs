using Training.Domain.Enums;

namespace Training.Domain.Entities;

public sealed record WorkoutExecution(
    Guid Id,
    Guid AthleteId,
    DateOnly Date,
    Guid? WorkoutTemplateId,
    IReadOnlyList<ExerciseExecution> Exercises,
    WorkoutExecutionSource Source,
    TimeSpan Duration,
    decimal TotalVolume,
    string? Notes,
    string? ProviderActivityId);
