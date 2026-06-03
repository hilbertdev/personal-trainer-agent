using Training.Domain.Entities;

namespace Training.Application.Abstractions;

public sealed record WorkoutAgentAnalysis(
    IReadOnlyList<WorkoutDay> Workouts,
    FatigueAnalysisResult Analysis);

public sealed record WorkoutAgentProjection(
    WeeklyPlan Plan,
    FatigueAnalysisResult Analysis);
