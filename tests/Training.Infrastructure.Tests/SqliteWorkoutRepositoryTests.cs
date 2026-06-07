using FluentAssertions;
using Training.Application.SampleData;
using Training.Infrastructure.Persistence;

namespace Training.Infrastructure.Tests;

public sealed class SqliteWorkoutRepositoryTests
{
    [Fact]
    [Trait("Category", TestCategories.Integration)]
    public async Task SaveWeeklyPlanAsync_ReplacesExistingWeek()
    {
        using var fixture = new SqliteTestFixture();
        var repository = new SqliteWorkoutRepository(fixture.ConnectionFactory);
        var sampleWeek = SampleWorkoutDataFactory.Create();

        await repository.SaveWeeklyPlanAsync(sampleWeek);
        var loaded = await repository.GetCurrentWeekAsync();

        loaded.Should().HaveCount(sampleWeek.Count);
        loaded[0].Exercises.Should().NotBeEmpty();
        loaded[2].TrainsLegs.Should().BeTrue();
    }

    [Fact]
    [Trait("Category", TestCategories.Integration)]
    public async Task SaveWeeklyPlanAsync_ReplacesPreviousDataOnSecondSave()
    {
        using var fixture = new SqliteTestFixture();
        var repository = new SqliteWorkoutRepository(fixture.ConnectionFactory);
        var sampleWeek = SampleWorkoutDataFactory.Create();
        var replacement = sampleWeek.Take(2).ToList();

        await repository.SaveWeeklyPlanAsync(sampleWeek);
        await repository.SaveWeeklyPlanAsync(replacement);

        var loaded = await repository.GetCurrentWeekAsync();

        loaded.Should().HaveCount(2);
    }

    [Fact]
    [Trait("Category", TestCategories.Integration)]
    public async Task GetCurrentWeekAsync_ReturnsWorkoutsOrderedByDate()
    {
        using var fixture = new SqliteTestFixture();
        var repository = new SqliteWorkoutRepository(fixture.ConnectionFactory);

        await repository.SaveWeeklyPlanAsync(SampleWorkoutDataFactory.Create());

        var loaded = await repository.GetCurrentWeekAsync();

        loaded.Select(workout => workout.Date).Should().BeInAscendingOrder();
    }
}
