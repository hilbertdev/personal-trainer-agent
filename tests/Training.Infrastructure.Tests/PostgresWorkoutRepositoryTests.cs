using FluentAssertions;
using Training.Application.SampleData;
using Training.Domain.Entities;
using Training.Domain.Enums;
using static Training.Domain.Enums.IntensityLevel;
using static Training.Domain.Enums.MuscleGroup;
using static Training.Domain.Enums.WorkoutType;

namespace Training.Infrastructure.Tests;

[Collection("Postgres")]
public sealed class PostgresWorkoutRepositoryTests(PostgresFixture fixture)
{
    [Fact]
    [Trait("Category", TestCategories.Postgres)]
    public async Task SaveWeeklyPlanAsync_PersistsWorkoutsWithExercises()
    {
        var repository = fixture.CreateRepository();
        var sampleWeek = SampleWorkoutDataFactory.Create();

        await repository.SaveWeeklyPlanAsync(sampleWeek);
        var loaded = await repository.GetCurrentWeekAsync();

        loaded.Should().HaveCount(sampleWeek.Count);
        loaded[0].Exercises.Should().Contain(exercise => exercise.Name.Contains("Bench Press"));
        loaded[2].TrainsLegs.Should().BeTrue();
    }

    [Fact]
    [Trait("Category", TestCategories.Postgres)]
    public async Task SaveWeeklyPlanAsync_ReplacesExistingWeek()
    {
        var repository = fixture.CreateRepository();
        var sampleWeek = SampleWorkoutDataFactory.Create();
        var replacement = new List<WorkoutDay>
        {
            new(
                new DateOnly(2026, 6, 1),
                Push,
                [new Exercise("Bench Press", 4, "8", null, [Chest])],
                60,
                Moderate,
                null)
        };

        await repository.SaveWeeklyPlanAsync(sampleWeek);
        await repository.SaveWeeklyPlanAsync(replacement);

        var loaded = await repository.GetCurrentWeekAsync();

        loaded.Should().HaveCount(1);
        loaded[0].Exercises.Should().ContainSingle(exercise => exercise.Name == "Bench Press");
    }

    [Fact]
    [Trait("Category", TestCategories.Postgres)]
    public async Task GetCurrentWeekAsync_ReturnsWorkoutsOrderedByDate()
    {
        var repository = fixture.CreateRepository();

        await repository.SaveWeeklyPlanAsync(SampleWorkoutDataFactory.Create());

        var loaded = await repository.GetCurrentWeekAsync();

        loaded.Select(workout => workout.Date).Should().BeInAscendingOrder();
    }
}
