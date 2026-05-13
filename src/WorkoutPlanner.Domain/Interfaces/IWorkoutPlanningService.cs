using WorkoutPlanner.Domain.Entities;

namespace WorkoutPlanner.Domain.Interfaces;

public interface IWorkoutPlanningService
{
    Task<WorkoutPlanningResult> BuildPlanAsync(
        IReadOnlyList<WorkoutDay> workouts,
        CancellationToken cancellationToken = default);
}
