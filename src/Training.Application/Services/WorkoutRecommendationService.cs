using Training.Application.Abstractions;
using Training.Domain.Entities;

namespace Training.Application.Services;

public sealed class WorkoutRecommendationService : IWorkoutRecommendationService
{
    public IReadOnlyList<string> BuildRecommendations(WorkoutPlanningResult result)
    {
        var recommendations = new List<string>
        {
            result.Analysis.EstimatedFatigue switch
            {
                "HIGH" => "Prioritize sleep, hydration, and at least one lower-intensity session this week.",
                "MODERATE" => "Keep progressing, but avoid stacking high-intensity sessions without recovery.",
                _ => "Fatigue is manageable; continue the planned hypertrophy progression."
            }
        };

        if (result.Plan.RecommendedRestDays.Count > 0)
        {
            var days = string.Join(", ", result.Plan.RecommendedRestDays.Select(day => day.ToString("yyyy-MM-dd")));
            recommendations.Add($"Recommended rest days: {days}.");
        }

        return recommendations;
    }
}
