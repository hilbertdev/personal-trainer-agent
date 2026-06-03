using Training.Application.Commands;
using Training.Domain.Entities;

namespace Training.Application.Abstractions;

public interface IWorkoutProgressService
{
    Task<WorkoutProgress> RecordCompletedWorkoutAsync(
        RecordCompletedWorkoutCommand command,
        CancellationToken cancellationToken = default);

    Task<WorkoutProgress> GetProgressAsync(CancellationToken cancellationToken = default);
}
