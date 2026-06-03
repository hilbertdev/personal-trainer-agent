namespace Training.Api.Contracts;

public sealed record ProjectedWeekResponse(
    int WeekNumber,
    IReadOnlyList<WorkoutDayResponse> Workouts);
