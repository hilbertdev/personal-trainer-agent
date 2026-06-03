namespace Training.Api.Contracts;

public sealed record WorkoutAnalysisBetaResponse(
    WorkoutSummaryResponse Summary,
    FatigueAnalysisResponse FatigueAnalysis,
    IReadOnlyList<ProjectedWeekResponse> ProjectedWeeks,
    IReadOnlyList<string> Recommendations,
    IReadOnlyList<string> Warnings);
