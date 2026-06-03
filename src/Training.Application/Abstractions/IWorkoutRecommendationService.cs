using Training.Domain.Entities;

namespace Training.Application.Abstractions;

public interface IWorkoutRecommendationService
{
    IReadOnlyList<string> BuildRecommendations(WorkoutPlanningResult result);
}
