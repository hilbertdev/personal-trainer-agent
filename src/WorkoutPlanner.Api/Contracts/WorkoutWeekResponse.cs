namespace WorkoutPlanner.Api.Contracts;

public sealed record WorkoutWeekResponse(
    WorkoutSummaryResponse Summary,
    IReadOnlyList<WorkoutDayResponse> Workouts);
