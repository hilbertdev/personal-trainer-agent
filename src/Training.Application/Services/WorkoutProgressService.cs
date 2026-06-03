using Training.Application.Abstractions;
using Training.Application.Commands;
using Training.Domain.Entities;

namespace Training.Application.Services;

public sealed class WorkoutProgressService(IWorkoutProgressRepository progressRepository) : IWorkoutProgressService
{
    public async Task<WorkoutProgress> RecordCompletedWorkoutAsync(
        RecordCompletedWorkoutCommand command,
        CancellationToken cancellationToken = default)
    {
        var completedWorkout = new CompletedWorkout(
            command.Id ?? Guid.NewGuid(),
            command.WorkoutDate,
            command.WorkoutType,
            command.CompletedAt ?? DateTimeOffset.UtcNow,
            command.Notes);

        await progressRepository.SaveCompletedWorkoutAsync(completedWorkout, cancellationToken);
        return await progressRepository.GetProgressAsync(cancellationToken);
    }

    public Task<WorkoutProgress> GetProgressAsync(CancellationToken cancellationToken = default)
    {
        return progressRepository.GetProgressAsync(cancellationToken);
    }
}
