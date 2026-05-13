namespace WorkoutPlanner.Application.Analysis;

public sealed record RecoveryAssessment(
    IReadOnlyList<string> Warnings,
    IReadOnlyList<DateOnly> RecommendedRestDays);
