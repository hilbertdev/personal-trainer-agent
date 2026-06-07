using FluentAssertions;
using NSubstitute;
using Training.Application.Abstractions;
using Training.Application.Services;
using Training.Domain.Entities;

namespace Training.Application.Tests;

public sealed class WorkoutAgentQueryServiceTests
{
    [Fact]
    public async Task GetAnalysisAsync_ReturnsNullWhenCurrentWeekEmpty()
    {
        var workoutRepository = Substitute.For<IWorkoutRepository>();
        workoutRepository.GetCurrentWeekAsync(Arg.Any<CancellationToken>()).Returns([]);

        var service = new WorkoutAgentQueryService(
            workoutRepository,
            Substitute.For<IFatigueAnalyzer>(),
            Substitute.For<IPhaseScheduler>());

        var result = await service.GetAnalysisAsync();

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetProjectionAsync_ReturnsNullWhenCurrentWeekEmpty()
    {
        var workoutRepository = Substitute.For<IWorkoutRepository>();
        workoutRepository.GetCurrentWeekAsync(Arg.Any<CancellationToken>()).Returns([]);

        var service = new WorkoutAgentQueryService(
            workoutRepository,
            Substitute.For<IFatigueAnalyzer>(),
            Substitute.For<IPhaseScheduler>());

        var result = await service.GetProjectionAsync();

        result.Should().BeNull();
    }
}
