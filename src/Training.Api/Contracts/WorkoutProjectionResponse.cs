namespace Training.Api.Contracts;

public sealed record WorkoutProjectionResponse(
    WorkoutSummaryResponse SeedWeekSummary,
    FatigueAnalysisResponse Analysis,
    IReadOnlyList<DateOnly> RecommendedRestDays,
    IReadOnlyList<ProjectedWeekResponse> ProjectedWeeks);
