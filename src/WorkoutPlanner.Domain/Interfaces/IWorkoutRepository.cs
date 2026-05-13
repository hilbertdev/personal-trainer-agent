using WorkoutPlanner.Domain.Entities;

namespace WorkoutPlanner.Domain.Interfaces;

public interface IWorkoutRepository
{
    Task SaveWeeklyPlanAsync(IReadOnlyList<WorkoutDay> workouts, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<WorkoutDay>> GetCurrentWeekAsync(CancellationToken cancellationToken = default);
}
