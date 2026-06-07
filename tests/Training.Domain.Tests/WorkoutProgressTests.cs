using FluentAssertions;
using Training.Domain.Entities;
using Training.Domain.Enums;

namespace Training.Domain.Tests;

public sealed class WorkoutProgressTests
{
    [Fact]
    public void CompletedCount_ReturnsWorkoutCount()
    {
        var progress = new WorkoutProgress([
            CreateCompleted(new DateOnly(2026, 1, 1)),
            CreateCompleted(new DateOnly(2026, 1, 3))
        ]);

        progress.CompletedCount.Should().Be(2);
    }

    [Fact]
    public void LastCompletedWorkoutDate_ReturnsMostRecentDate()
    {
        var progress = new WorkoutProgress([
            CreateCompleted(new DateOnly(2026, 1, 1)),
            CreateCompleted(new DateOnly(2026, 1, 5)),
            CreateCompleted(new DateOnly(2026, 1, 3))
        ]);

        progress.LastCompletedWorkoutDate.Should().Be(new DateOnly(2026, 1, 5));
    }

    [Fact]
    public void LastCompletedWorkoutDate_ReturnsNullWhenEmpty()
    {
        var progress = new WorkoutProgress([]);

        progress.LastCompletedWorkoutDate.Should().BeNull();
    }

    private static CompletedWorkout CreateCompleted(DateOnly date)
    {
        return new CompletedWorkout(Guid.NewGuid(), date, WorkoutType.Push, DateTimeOffset.UtcNow, null);
    }
}
