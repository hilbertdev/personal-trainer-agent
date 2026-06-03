using Training.Domain.Enums;

namespace Training.Application.Commands;

public sealed record RecordCompletedWorkoutCommand(
    Guid? Id,
    DateOnly WorkoutDate,
    WorkoutType WorkoutType,
    DateTimeOffset? CompletedAt,
    string? Notes);
