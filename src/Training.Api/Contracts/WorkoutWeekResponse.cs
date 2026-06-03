namespace Training.Api.Contracts;

public sealed record WorkoutWeekResponse(
    WorkoutSummaryResponse Summary,
    IReadOnlyList<WorkoutDayResponse> Workouts);
