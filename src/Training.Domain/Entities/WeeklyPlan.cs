namespace Training.Domain.Entities;

public sealed record WeeklyPlan(
    Guid Id,
    int WeekNumber,
    IReadOnlyList<WorkoutTemplate> WorkoutTemplates,
    IReadOnlyList<WorkoutDay> Workouts,
    IReadOnlyList<DateOnly> RecommendedRestDays,
    IReadOnlyList<ProjectedWeek> ProjectedWeeks)
{
    public WeeklyPlan(int weekNumber, IReadOnlyList<WorkoutTemplate> workoutTemplates)
        : this(Guid.NewGuid(), weekNumber, workoutTemplates, [], [], [])
    {
    }

    public WeeklyPlan(
        IReadOnlyList<WorkoutDay> workouts,
        IReadOnlyList<DateOnly> recommendedRestDays,
        IReadOnlyList<ProjectedWeek> projectedWeeks)
        : this(Guid.Empty, 0, [], workouts, recommendedRestDays, projectedWeeks)
    {
    }
}
