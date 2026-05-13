using WorkoutPlanner.Domain.Entities;
using WorkoutPlanner.Domain.Interfaces;

namespace WorkoutPlanner.Infrastructure.Persistence;

public sealed class InMemoryWorkoutRepository : IWorkoutRepository
{
    private readonly List<WorkoutDay> _workouts = [];

    public Task SaveWeeklyPlanAsync(
        IReadOnlyList<WorkoutDay> workouts,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        _workouts.Clear();
        _workouts.AddRange(workouts.OrderBy(workout => workout.Date));

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<WorkoutDay>> GetCurrentWeekAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        IReadOnlyList<WorkoutDay> workouts = _workouts
            .OrderBy(workout => workout.Date)
            .ToList();

        return Task.FromResult(workouts);
    }
}
