namespace Training.Domain.Entities;

public sealed record WorkoutTemplate(
    Guid Id,
    string Name,
    DayOfWeek DayOfWeek,
    IReadOnlyList<ExerciseTemplate> Exercises,
    string? WorkoutType,
    string? Description);
