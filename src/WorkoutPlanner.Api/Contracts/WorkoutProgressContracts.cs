using WorkoutPlanner.Domain.Enums;

namespace WorkoutPlanner.Api.Contracts;

public sealed record CompletedWorkoutRequest(
    Guid? Id,
    DateOnly WorkoutDate,
    WorkoutType WorkoutType,
    DateTimeOffset? CompletedAt,
    string? Notes);

public sealed record CompletedWorkoutResponse(
    Guid Id,
    DateOnly WorkoutDate,
    WorkoutType WorkoutType,
    DateTimeOffset CompletedAt,
    string? Notes);

public sealed record WorkoutProgressResponse(
    int CompletedCount,
    DateOnly? LastCompletedWorkoutDate,
    IReadOnlyList<CompletedWorkoutResponse> CompletedWorkouts);
