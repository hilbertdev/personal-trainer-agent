namespace WorkoutPlanner.Application.Strava;

public interface IStravaTokenService
{
    Task<string> GetValidAccessTokenAsync(long athleteId, CancellationToken cancellationToken = default);
}
