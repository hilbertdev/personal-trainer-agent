using Training.Domain.Entities;

namespace Training.Application.Abstractions;

public interface IWorkoutAgentQueryService
{
    Task<IReadOnlyList<WorkoutDay>> GetCurrentWeekAsync(CancellationToken cancellationToken = default);

    Task<WorkoutAgentAnalysis?> GetAnalysisAsync(CancellationToken cancellationToken = default);

    Task<WorkoutAgentProjection?> GetProjectionAsync(CancellationToken cancellationToken = default);
}
