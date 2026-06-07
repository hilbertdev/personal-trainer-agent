using FluentAssertions;
using Training.Application.Analysis;
using Training.Domain.Entities;
using Training.Domain.Enums;
using static Training.Domain.Enums.IntensityLevel;
using static Training.Domain.Enums.MuscleGroup;
using static Training.Domain.Enums.WorkoutType;

namespace Training.Application.Tests;

public sealed class RecoveryHeuristicAnalyzerTests
{
    private readonly RecoveryHeuristicAnalyzer _analyzer = new();

    [Fact]
    public void Analyze_DetectsFourConsecutiveTrainingDays()
    {
        var workouts = CreateConsecutiveTrainingDays(4, Moderate);

        var result = _analyzer.Analyze(workouts, totalFatigueScore: 100);

        result.Warnings.Should().Contain("4 consecutive training days detected");
        result.RecommendedRestDays.Should().Contain(new DateOnly(2026, 1, 5));
    }

    [Fact]
    public void Analyze_DetectsSixConsecutiveTrainingDays()
    {
        var workouts = CreateConsecutiveTrainingDays(6, Moderate);

        var result = _analyzer.Analyze(workouts, totalFatigueScore: 100);

        result.Warnings.Should().Contain("6+ consecutive training days detected");
    }

    [Fact]
    public void Analyze_DetectsThreeConsecutiveHighIntensityDays()
    {
        var workouts = CreateConsecutiveTrainingDays(3, High);

        var result = _analyzer.Analyze(workouts, totalFatigueScore: 100);

        result.Warnings.Should().Contain("3 consecutive High intensity sessions detected");
    }

    [Fact]
    public void Analyze_DetectsHighIntensityClusteringInFourDayWindow()
    {
        var start = new DateOnly(2026, 2, 1);
        var workouts = new List<WorkoutDay>
        {
            CreateTrainingDay(start, High),
            CreateTrainingDay(start.AddDays(1), High),
            new WorkoutDay(start.AddDays(2), Rest, [], 0, Low, null),
            CreateTrainingDay(start.AddDays(3), High)
        };

        var result = _analyzer.Analyze(workouts, totalFatigueScore: 100);

        result.Warnings.Should().Contain("High intensity sessions are clustered too closely");
    }

    [Fact]
    public void Analyze_DetectsLegsTrainedWithin72Hours()
    {
        var start = new DateOnly(2026, 2, 1);
        var workouts = new List<WorkoutDay>
        {
            CreateLegDay(start),
            CreateLegDay(start.AddDays(2))
        };

        var result = _analyzer.Analyze(workouts, totalFatigueScore: 100);

        result.Warnings.Should().Contain("Legs trained twice within 72h");
    }

    [Fact]
    public void Analyze_DetectsChestRetrainedBefore48HourWindow()
    {
        var start = new DateOnly(2026, 2, 1);
        var workouts = new List<WorkoutDay>
        {
            CreateTrainingDay(start, Moderate, [Chest]),
            CreateTrainingDay(start.AddDays(1), Moderate, [Chest])
        };

        var result = _analyzer.Analyze(workouts, totalFatigueScore: 100);

        result.Warnings.Should().ContainSingle(warning => warning.Contains("Chest retrained before a full 48h recovery window"));
    }

    [Fact]
    public void Analyze_DetectsHighWeeklyVolume()
    {
        var workouts = new List<WorkoutDay>
        {
            CreateTrainingDay(new DateOnly(2026, 2, 1), Moderate, [Chest], sets: 30),
            CreateTrainingDay(new DateOnly(2026, 2, 2), Moderate, [Back], sets: 30),
            CreateTrainingDay(new DateOnly(2026, 2, 3), Moderate, [Shoulders], sets: 31)
        };

        var result = _analyzer.Analyze(workouts, totalFatigueScore: 100);

        result.Warnings.Should().Contain("Weekly training volume is high for a hypertrophy block");
    }

    [Fact]
    public void Analyze_DetectsHighLegVolume()
    {
        var workouts = new List<WorkoutDay>
        {
            CreateLegDay(new DateOnly(2026, 2, 1), sets: 20),
            CreateLegDay(new DateOnly(2026, 2, 5), sets: 13)
        };

        var result = _analyzer.Analyze(workouts, totalFatigueScore: 100);

        result.Warnings.Should().Contain("Leg volume is concentrated enough to increase lower-body fatigue");
    }

    [Fact]
    public void Analyze_WarnsWhenFatigueScoreIsHigh()
    {
        var workouts = CreateConsecutiveTrainingDays(2, Moderate);

        var result = _analyzer.Analyze(workouts, totalFatigueScore: 185);

        result.Warnings.Should().Contain("Weekly fatigue score is high");
    }

    [Fact]
    public void Analyze_WarnsWhenFatigueScoreExceedsProjectionThreshold()
    {
        var workouts = CreateConsecutiveTrainingDays(2, Moderate);

        var result = _analyzer.Analyze(workouts, totalFatigueScore: 225);

        result.Warnings.Should().Contain("Weekly fatigue score exceeds the projection reduction threshold");
    }

    private static IReadOnlyList<WorkoutDay> CreateConsecutiveTrainingDays(int count, IntensityLevel intensity)
    {
        var start = new DateOnly(2026, 1, 1);
        return Enumerable.Range(0, count)
            .Select(offset => CreateTrainingDay(start.AddDays(offset), intensity))
            .ToList();
    }

    private static WorkoutDay CreateTrainingDay(
        DateOnly date,
        IntensityLevel intensity,
        IReadOnlyList<MuscleGroup>? muscleGroups = null,
        int sets = 4)
    {
        return new WorkoutDay(
            date,
            Push,
            [new Exercise("Press", sets, "8", null, muscleGroups ?? [Chest])],
            60,
            intensity,
            null);
    }

    private static WorkoutDay CreateLegDay(DateOnly date, int sets = 8)
    {
        return new WorkoutDay(
            date,
            Legs,
            [new Exercise("Squat", sets, "5", null, [Quads, Glutes])],
            90,
            High,
            null);
    }
}
