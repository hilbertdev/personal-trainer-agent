using WorkoutPlanner.Domain.Enums;

namespace WorkoutPlanner.Domain.Entities;

public sealed record CompletedWorkout(
    Guid Id,
    DateOnly WorkoutDate,
    WorkoutType WorkoutType,
    DateTimeOffset CompletedAt,
    string? Notes);
