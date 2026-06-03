using Training.Domain.Enums;

namespace Training.Domain.Entities;

public sealed record Workout(
    Guid Id,
    Guid AthleteId,
    DateTimeOffset StartedAt,
    TimeSpan Duration,
    WorkoutCategory Category,
    TrainingLoad Load,
    string? Notes);
