using FluentAssertions;
using Training.Domain.Entities;
using Training.Domain.Enums;
using static Training.Domain.Enums.IntensityLevel;
using static Training.Domain.Enums.MuscleGroup;
using static Training.Domain.Enums.WorkoutType;

namespace Training.Domain.Tests;

public sealed class WorkoutDayTests
{
    [Fact]
    public void IsRestDay_ReturnsTrueForRestWorkoutType()
    {
        var day = new WorkoutDay(new DateOnly(2026, 1, 1), Rest, [], 0, Low, null);

        day.IsRestDay.Should().BeTrue();
    }

    [Fact]
    public void IsRestDay_ReturnsTrueWhenExercisesEmpty()
    {
        var day = new WorkoutDay(new DateOnly(2026, 1, 1), Push, [], 60, Moderate, null);

        day.IsRestDay.Should().BeTrue();
    }

    [Fact]
    public void IsRestDay_ReturnsFalseWhenExercisesPresent()
    {
        var day = CreateTrainingDay([new Exercise("Bench Press", 4, "8", null, [Chest])]);

        day.IsRestDay.Should().BeFalse();
    }

    [Fact]
    public void TotalSets_SumsExerciseSets()
    {
        var day = CreateTrainingDay([
            new Exercise("Bench Press", 4, "8", null, [Chest]),
            new Exercise("Row", 3, "10", null, [Back])
        ]);

        day.TotalSets.Should().Be(7);
    }

    [Fact]
    public void TrainedMuscleGroups_ReturnsDistinctGroups()
    {
        var day = CreateTrainingDay([
            new Exercise("Bench Press", 4, "8", null, [Chest, Triceps]),
            new Exercise("Fly", 3, "12", null, [Chest])
        ]);

        day.TrainedMuscleGroups.Should().BeEquivalentTo([Chest, Triceps]);
    }

    [Fact]
    public void TrainsLegs_ReturnsTrueWhenLegMusclesPresent()
    {
        var day = CreateTrainingDay([
            new Exercise("Squat", 4, "5", null, [Quads, Glutes])
        ]);

        day.TrainsLegs.Should().BeTrue();
    }

    [Fact]
    public void TrainsLegs_ReturnsFalseForUpperBodyOnly()
    {
        var day = CreateTrainingDay([
            new Exercise("Bench Press", 4, "8", null, [Chest, Triceps])
        ]);

        day.TrainsLegs.Should().BeFalse();
    }

    private static WorkoutDay CreateTrainingDay(IReadOnlyList<Exercise> exercises)
    {
        return new WorkoutDay(new DateOnly(2026, 1, 1), Push, exercises, 60, Moderate, null);
    }
}
