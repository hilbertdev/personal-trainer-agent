namespace WorkoutPlanner.Api.Contracts;

public sealed record FatigueAnalysisResponse(
    int TotalFatigueScore,
    string EstimatedFatigue,
    IReadOnlyList<string> Warnings,
    IReadOnlyList<DateOnly> RecommendedRestDays);
