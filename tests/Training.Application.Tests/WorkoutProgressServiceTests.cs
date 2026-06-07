using FluentAssertions;
using NSubstitute;
using Training.Application.Abstractions;
using Training.Application.Commands;
using Training.Application.Services;
using Training.Domain.Entities;
using Training.Domain.Enums;

namespace Training.Application.Tests;

public sealed class WorkoutProgressServiceTests
{
    [Fact]
    public async Task RecordCompletedWorkoutAsync_AssignsDefaultsWhenMissing()
    {
        var repository = Substitute.For<IWorkoutProgressRepository>();
        CompletedWorkout? savedWorkout = null;
        repository.SaveCompletedWorkoutAsync(Arg.Any<CompletedWorkout>(), Arg.Any<CancellationToken>())
            .Returns(callInfo =>
            {
                savedWorkout = callInfo.Arg<CompletedWorkout>();
                return savedWorkout;
            });
        repository.GetProgressAsync(Arg.Any<CancellationToken>())
            .Returns(callInfo => new WorkoutProgress(savedWorkout is null ? [] : [savedWorkout]));

        var service = new WorkoutProgressService(repository);
        var before = DateTimeOffset.UtcNow;

        var progress = await service.RecordCompletedWorkoutAsync(
            new RecordCompletedWorkoutCommand(
                null,
                new DateOnly(2026, 4, 1),
                WorkoutType.Push,
                null,
                "Done"));

        progress.CompletedCount.Should().Be(1);
        savedWorkout!.Id.Should().NotBe(Guid.Empty);
        savedWorkout.CompletedAt.Should().BeOnOrAfter(before);
    }
}
