using FluentAssertions;
using Training.Application.Services;
using Training.Domain.Entities;

namespace Training.Application.Tests;

public sealed class WorkoutRecommendationServiceTests
{
    private readonly WorkoutRecommendationService _service = new();

    [Theory]
    [InlineData("HIGH", "Prioritize sleep, hydration, and at least one lower-intensity session this week.")]
    [InlineData("MODERATE", "Keep progressing, but avoid stacking high-intensity sessions without recovery.")]
    [InlineData("LOW", "Fatigue is manageable; continue the planned hypertrophy progression.")]
    public void BuildRecommendations_SelectsMessageForFatigueTier(string fatigueTier, string expectedMessage)
    {
        var result = CreatePlanningResult(fatigueTier, []);

        var recommendations = _service.BuildRecommendations(result);

        recommendations[0].Should().Be(expectedMessage);
    }

    [Fact]
    public void BuildRecommendations_IncludesRecommendedRestDays()
    {
        var restDays = new List<DateOnly> { new(2026, 5, 15), new(2026, 5, 18) };
        var result = CreatePlanningResult("MODERATE", restDays);

        var recommendations = _service.BuildRecommendations(result);

        recommendations.Should().ContainSingle(message => message.Contains("2026-05-15") && message.Contains("2026-05-18"));
    }

    private static WorkoutPlanningResult CreatePlanningResult(
        string estimatedFatigue,
        IReadOnlyList<DateOnly> recommendedRestDays)
    {
        return new WorkoutPlanningResult(
            new FatigueAnalysisResult(100, estimatedFatigue, [], recommendedRestDays),
            new WeeklyPlan([], recommendedRestDays, []));
    }
}
