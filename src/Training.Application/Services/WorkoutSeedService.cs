using Training.Application.Abstractions;
using Training.Application.SampleData;
using Training.Domain.Entities;

namespace Training.Application.Services;

public sealed class WorkoutSeedService(IWorkoutRepository workoutRepository) : IWorkoutSeedService
{
    public IReadOnlyList<WorkoutDay> CreateSampleWeek()
    {
        return SampleWorkoutDataFactory.Create();
    }

    public async Task SeedSampleWeekAsync(CancellationToken cancellationToken = default)
    {
        var currentWeek = await workoutRepository.GetCurrentWeekAsync(cancellationToken);

        if (currentWeek.Count is 0)
        {
            await workoutRepository.SaveWeeklyPlanAsync(CreateSampleWeek(), cancellationToken);
        }
    }
}
