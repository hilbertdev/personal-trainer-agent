namespace WorkoutPlanner.Api.Contracts;

public sealed record ProjectedWeekResponse(
    int WeekNumber,
    IReadOnlyList<WorkoutDayResponse> Workouts);
