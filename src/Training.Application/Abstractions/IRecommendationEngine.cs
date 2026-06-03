using Training.Domain.Entities;

namespace Training.Application.Abstractions;

public interface IRecommendationEngine
{
    Task<Recommendation> GenerateDailyRecommendationAsync(
        Athlete athlete,
        TrainingLoad trainingLoad,
        Fatigue fatigue,
        RecoveryStatus recoveryStatus,
        CancellationToken cancellationToken = default);
}
