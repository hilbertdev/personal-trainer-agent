using WorkoutPlanner.Domain.Entities;

namespace WorkoutPlanner.Application.Strava;

public interface IStravaOAuthService
{
    string GenerateAuthorizationUrl();

    Task<StravaConnection> ExchangeCodeAsync(
        string code,
        string? scope,
        CancellationToken cancellationToken = default);
}
