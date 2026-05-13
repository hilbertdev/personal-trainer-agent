namespace WorkoutPlanner.Domain.Entities;

public sealed record ProjectedWeek(
    int WeekNumber,
    IReadOnlyList<WorkoutDay> Workouts);
