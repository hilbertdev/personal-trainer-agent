using FluentAssertions;
using Training.Application.Analysis;
using Training.Application.SampleData;
using Training.Domain.Entities;
using Training.Domain.Enums;
using static Training.Domain.Enums.IntensityLevel;
using static Training.Domain.Enums.MuscleGroup;
using static Training.Domain.Enums.WorkoutType;

namespace Training.Application.Tests;

public sealed class FatigueScoreCalculatorTests
{
    private readonly FatigueScoreCalculator _calculator = new();

    [Fact]
    public void CalculateWorkoutScore_ReturnsZeroForRestDay()
    {
        var restDay = new WorkoutDay(new DateOnly(2026, 1, 1), Rest, [], 0, Low, null);

        _calculator.CalculateWorkoutScore(restDay).Should().Be(0);
    }

    [Fact]
    public void CalculateWorkoutScore_LegDayScoresHigherThanModeratePush()
    {
        var legDay = new WorkoutDay(
            new DateOnly(2026, 1, 1),
            Legs,
            [new Exercise("Back Squat", 5, "5", null, [Quads, Glutes])],
            95,
            High,
            null);

        var pushDay = new WorkoutDay(
            new DateOnly(2026, 1, 1),
            Push,
            [new Exercise("Machine Press", 3, "10", null, [Chest])],
            60,
            Moderate,
            null);

        _calculator.CalculateWorkoutScore(legDay)
            .Should().BeGreaterThan(_calculator.CalculateWorkoutScore(pushDay));
    }

    [Fact]
    public void CalculateWorkoutScore_DetectsCompoundMovementKeywords()
    {
        var withCompound = new WorkoutDay(
            new DateOnly(2026, 1, 1),
            Push,
            [new Exercise("Barbell Bench Press", 4, "6", null, [Chest])],
            60,
            High,
            null);

        var withoutCompound = new WorkoutDay(
            new DateOnly(2026, 1, 1),
            Push,
            [new Exercise("Cable Fly", 4, "12", null, [Chest])],
            60,
            High,
            null);

        _calculator.CalculateWorkoutScore(withCompound)
            .Should().BeGreaterThan(_calculator.CalculateWorkoutScore(withoutCompound));
    }

    [Fact]
    public void CalculateWeeklyScore_AccumulatesConsecutiveTrainingDays()
    {
        var workouts = Enumerable.Range(0, 4)
            .Select(offset => new WorkoutDay(
                new DateOnly(2026, 1, 5).AddDays(offset),
                Push,
                [new Exercise("Press", 3, "8", null, [Chest])],
                60,
                Moderate,
                null))
            .ToList();

        var scoreWithConsecutiveDays = _calculator.CalculateWeeklyScore(workouts);
        var scoreWithRestBreak = _calculator.CalculateWeeklyScore([
            workouts[0],
            workouts[1],
            new WorkoutDay(new DateOnly(2026, 1, 7), Rest, [], 0, Low, null),
            workouts[2],
            workouts[3]
        ]);

        scoreWithConsecutiveDays.Should().BeGreaterThan(scoreWithRestBreak);
    }

    [Fact]
    public void CalculateWeeklyScore_ResetsConsecutiveLoadAfterRestDay()
    {
        var sampleWeek = SampleWorkoutDataFactory.Create().ToList();
        var withRest = sampleWeek
            .Select((workout, index) => index == 2
                ? new WorkoutDay(workout.Date, Rest, [], 0, Low, "Recovery")
                : workout)
            .ToList();

        _calculator.CalculateWeeklyScore(withRest)
            .Should().BeLessThan(_calculator.CalculateWeeklyScore(sampleWeek));
    }

    [Fact]
    public void CalculateWeeklyScore_UsesSampleWeekBaseline()
    {
        var score = _calculator.CalculateWeeklyScore(SampleWorkoutDataFactory.Create());

        score.Should().BeGreaterThan(100);
    }
}
