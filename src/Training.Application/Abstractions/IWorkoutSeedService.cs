using Training.Domain.Entities;

namespace Training.Application.Abstractions;

public interface IWorkoutSeedService
{
    IReadOnlyList<WorkoutDay> CreateSampleWeek();

    Task SeedSampleWeekAsync(CancellationToken cancellationToken = default);
}
