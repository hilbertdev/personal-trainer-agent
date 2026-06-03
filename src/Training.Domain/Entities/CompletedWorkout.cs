using Training.Domain.Enums;

namespace Training.Domain.Entities;

public sealed record CompletedWorkout(
    Guid Id,
    DateOnly WorkoutDate,
    WorkoutType WorkoutType,
    DateTimeOffset CompletedAt,
    string? Notes);
