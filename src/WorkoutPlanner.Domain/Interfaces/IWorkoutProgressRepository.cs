using WorkoutPlanner.Domain.Entities;

namespace WorkoutPlanner.Domain.Interfaces;

public interface IWorkoutProgressRepository
{
    Task<CompletedWorkout> SaveCompletedWorkoutAsync(
        CompletedWorkout completedWorkout,
        CancellationToken cancellationToken = default);

    Task<WorkoutProgress> GetProgressAsync(CancellationToken cancellationToken = default);
}
