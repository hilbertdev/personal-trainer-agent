using WorkoutPlanner.Domain.Entities;

namespace WorkoutPlanner.Domain.Interfaces;

public interface IFatigueAnalyzer
{
    Task<FatigueAnalysisResult> AnalyzeAsync(
        IReadOnlyList<WorkoutDay> workouts,
        CancellationToken cancellationToken = default);
}
