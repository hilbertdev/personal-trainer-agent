using FluentAssertions;
using Training.Domain.Entities;
using Training.Domain.Enums;
using Training.Infrastructure.Persistence;

namespace Training.Infrastructure.Tests;

public sealed class SqliteWorkoutProgressRepositoryTests
{
    [Fact]
    [Trait("Category", TestCategories.Integration)]
    public async Task SaveCompletedWorkoutAsync_UpsertsById()
    {
        using var fixture = new SqliteTestFixture();
        var repository = new SqliteWorkoutProgressRepository(fixture.ConnectionFactory);
        var workoutId = Guid.NewGuid();
        var first = new CompletedWorkout(
            workoutId,
            new DateOnly(2026, 4, 1),
            WorkoutType.Push,
            DateTimeOffset.Parse("2026-04-01T10:00:00Z"),
            "First");
        var updated = first with { Notes = "Updated" };

        await repository.SaveCompletedWorkoutAsync(first);
        await repository.SaveCompletedWorkoutAsync(updated);

        var progress = await repository.GetProgressAsync();

        progress.CompletedCount.Should().Be(1);
        progress.CompletedWorkouts[0].Notes.Should().Be("Updated");
    }

    [Fact]
    [Trait("Category", TestCategories.Integration)]
    public async Task GetProgressAsync_OrdersByWorkoutDateDescending()
    {
        using var fixture = new SqliteTestFixture();
        var repository = new SqliteWorkoutProgressRepository(fixture.ConnectionFactory);

        await repository.SaveCompletedWorkoutAsync(CreateCompleted(new DateOnly(2026, 4, 1)));
        await repository.SaveCompletedWorkoutAsync(CreateCompleted(new DateOnly(2026, 4, 5)));
        await repository.SaveCompletedWorkoutAsync(CreateCompleted(new DateOnly(2026, 4, 3)));

        var progress = await repository.GetProgressAsync();

        progress.CompletedWorkouts.Select(workout => workout.WorkoutDate)
            .Should().BeInDescendingOrder();
    }

    private static CompletedWorkout CreateCompleted(DateOnly date)
    {
        return new CompletedWorkout(
            Guid.NewGuid(),
            date,
            WorkoutType.Pull,
            DateTimeOffset.UtcNow,
            null);
    }
}
