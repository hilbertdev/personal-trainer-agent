using WorkoutPlanner.Domain.Entities;

namespace WorkoutPlanner.Domain.Interfaces;

public interface IPhaseScheduler
{
    Task<WeeklyPlan> ProjectAsync(
        IReadOnlyList<WorkoutDay> seedWeek,
        FatigueAnalysisResult analysis,
        CancellationToken cancellationToken = default);
}
