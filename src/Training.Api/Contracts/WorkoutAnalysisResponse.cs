namespace Training.Api.Contracts;

public sealed record WorkoutAnalysisResponse(
    WorkoutSummaryResponse Summary,
    FatigueAnalysisResponse Analysis);
