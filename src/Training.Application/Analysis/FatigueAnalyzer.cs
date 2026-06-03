using Training.Domain.Entities;
using Training.Application.Abstractions;

namespace Training.Application.Analysis;

public sealed class FatigueAnalyzer(
    FatigueScoreCalculator scoreCalculator,
    RecoveryHeuristicAnalyzer recoveryHeuristicAnalyzer) : IFatigueAnalyzer
{
    public Task<FatigueAnalysisResult> AnalyzeAsync(
        IReadOnlyList<WorkoutDay> workouts,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var orderedWorkouts = workouts.OrderBy(workout => workout.Date).ToList();
        var totalFatigueScore = scoreCalculator.CalculateWeeklyScore(orderedWorkouts);
        var recoveryAssessment = recoveryHeuristicAnalyzer.Analyze(orderedWorkouts, totalFatigueScore);

        var result = new FatigueAnalysisResult(
            totalFatigueScore,
            EstimateFatigue(totalFatigueScore),
            recoveryAssessment.Warnings,
            recoveryAssessment.RecommendedRestDays);

        return Task.FromResult(result);
    }

    private static string EstimateFatigue(int totalFatigueScore)
    {
        return totalFatigueScore switch
        {
            < 70 => "LOW",
            < 140 => "MODERATE",
            _ => "HIGH"
        };
    }
}
