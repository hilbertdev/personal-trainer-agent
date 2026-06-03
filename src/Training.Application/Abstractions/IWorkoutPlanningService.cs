using Training.Domain.Entities;

namespace Training.Application.Abstractions;

public interface IWorkoutPlanningService
{
    Task<WorkoutPlanningResult> BuildPlanAsync(
        IReadOnlyList<WorkoutDay> workouts,
        CancellationToken cancellationToken = default);
}
