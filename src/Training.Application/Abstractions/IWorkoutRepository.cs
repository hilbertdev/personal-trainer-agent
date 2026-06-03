using Training.Domain.Entities;

namespace Training.Application.Abstractions;

public interface IWorkoutRepository
{
    Task SaveWeeklyPlanAsync(IReadOnlyList<WorkoutDay> workouts, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<WorkoutDay>> GetCurrentWeekAsync(CancellationToken cancellationToken = default);
}
