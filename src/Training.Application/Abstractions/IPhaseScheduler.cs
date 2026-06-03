using Training.Domain.Entities;

namespace Training.Application.Abstractions;

public interface IPhaseScheduler
{
    Task<WeeklyPlan> ProjectAsync(
        IReadOnlyList<WorkoutDay> seedWeek,
        FatigueAnalysisResult analysis,
        CancellationToken cancellationToken = default);
}
