namespace WorkoutPlanner.Domain.Entities;

public sealed record FatigueAnalysisResult(
    int TotalFatigueScore,
    string EstimatedFatigue,
    IReadOnlyList<string> Warnings,
    IReadOnlyList<DateOnly> RecommendedRestDays);
