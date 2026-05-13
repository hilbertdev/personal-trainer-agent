namespace WorkoutPlanner.Domain.Entities;

public sealed record WorkoutPlanningResult(
    FatigueAnalysisResult Analysis,
    WeeklyPlan Plan);
