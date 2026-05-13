namespace WorkoutPlanner.Domain.Entities;

public sealed record WeeklyPlan(
    IReadOnlyList<WorkoutDay> Workouts,
    IReadOnlyList<DateOnly> RecommendedRestDays,
    IReadOnlyList<ProjectedWeek> ProjectedWeeks);
