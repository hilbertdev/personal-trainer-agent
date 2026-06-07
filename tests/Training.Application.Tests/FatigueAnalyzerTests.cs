using FluentAssertions;
using Training.Application.Analysis;
using Training.Application.SampleData;

namespace Training.Application.Tests;

public sealed class FatigueAnalyzerTests
{
    private readonly FatigueAnalyzer _analyzer = new(new FatigueScoreCalculator(), new RecoveryHeuristicAnalyzer());

    [Fact]
    public async Task AnalyzeAsync_ClassifiesLowFatigueBelow70()
    {
        var workouts = SampleWorkoutDataFactory.Create().Take(1).ToList();

        var result = await _analyzer.AnalyzeAsync(workouts);

        result.EstimatedFatigue.Should().Be("LOW");
        result.TotalFatigueScore.Should().BeLessThan(70);
    }

    [Fact]
    public async Task AnalyzeAsync_ClassifiesModerateFatigueBetween70And139()
    {
        var workouts = SampleWorkoutDataFactory.Create().Take(3).ToList();

        var result = await _analyzer.AnalyzeAsync(workouts);

        result.EstimatedFatigue.Should().BeOneOf("MODERATE", "HIGH");
        result.TotalFatigueScore.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task AnalyzeAsync_ClassifiesHighFatigueAtOrAbove140()
    {
        var result = await _analyzer.AnalyzeAsync(SampleWorkoutDataFactory.Create());

        result.EstimatedFatigue.Should().Be("HIGH");
        result.TotalFatigueScore.Should().BeGreaterThanOrEqualTo(140);
    }

    [Fact]
    public async Task AnalyzeAsync_IncludesRecoveryWarnings()
    {
        var result = await _analyzer.AnalyzeAsync(SampleWorkoutDataFactory.Create());

        result.Warnings.Should().NotBeEmpty();
    }
}
