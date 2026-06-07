using FluentAssertions;
using NSubstitute;
using Training.Application.Abstractions;
using Training.Application.Services;
using Training.Domain.Entities;

namespace Training.Application.Tests;

public sealed class WorkoutSeedServiceTests
{
    [Fact]
    public async Task SeedSampleWeekAsync_SkipsWhenCurrentWeekAlreadyPopulated()
    {
        var repository = Substitute.For<IWorkoutRepository>();
        repository.GetCurrentWeekAsync(Arg.Any<CancellationToken>())
            .Returns([new WorkoutDay(new DateOnly(2026, 1, 1), Domain.Enums.WorkoutType.Push, [], 60, Domain.Enums.IntensityLevel.Moderate, null)]);

        var service = new WorkoutSeedService(repository);

        await service.SeedSampleWeekAsync();

        await repository.DidNotReceive().SaveWeeklyPlanAsync(Arg.Any<IReadOnlyList<WorkoutDay>>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task SeedSampleWeekAsync_SavesSampleWeekWhenEmpty()
    {
        var repository = Substitute.For<IWorkoutRepository>();
        repository.GetCurrentWeekAsync(Arg.Any<CancellationToken>()).Returns([]);

        var service = new WorkoutSeedService(repository);

        await service.SeedSampleWeekAsync();

        await repository.Received(1).SaveWeeklyPlanAsync(
            Arg.Is<IReadOnlyList<WorkoutDay>>(week => week.Count == 7),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public void CreateSampleWeek_ReturnsSevenDayPlan()
    {
        var service = new WorkoutSeedService(Substitute.For<IWorkoutRepository>());

        service.CreateSampleWeek().Should().HaveCount(7);
    }
}
