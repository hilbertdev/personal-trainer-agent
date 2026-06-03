using Training.Domain.Entities;

namespace Training.Application.Abstractions;

public interface IWorkoutProgressRepository
{
    Task<CompletedWorkout> SaveCompletedWorkoutAsync(
        CompletedWorkout completedWorkout,
        CancellationToken cancellationToken = default);

    Task<WorkoutProgress> GetProgressAsync(CancellationToken cancellationToken = default);
}
