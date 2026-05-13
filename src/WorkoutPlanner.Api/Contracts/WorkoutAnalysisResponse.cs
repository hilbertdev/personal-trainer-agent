namespace WorkoutPlanner.Api.Contracts;

public sealed record WorkoutAnalysisResponse(
    WorkoutSummaryResponse Summary,
    FatigueAnalysisResponse Analysis);
