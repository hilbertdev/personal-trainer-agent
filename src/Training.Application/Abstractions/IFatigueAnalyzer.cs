using Training.Domain.Entities;

namespace Training.Application.Abstractions;

public interface IFatigueAnalyzer
{
    Task<FatigueAnalysisResult> AnalyzeAsync(
        IReadOnlyList<WorkoutDay> workouts,
        CancellationToken cancellationToken = default);
}
