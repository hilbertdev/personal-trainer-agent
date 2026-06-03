namespace WorkoutPlanner.Application.Strava;

public interface IStravaClient
{
    Task<StravaAthleteDto> GetAthleteAsync(long athleteId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<StravaActivityDto>> GetActivitiesAsync(
        long athleteId,
        int page = 1,
        int perPage = 200,
        DateTime? before = null,
        DateTime? after = null,
        CancellationToken cancellationToken = default);
}
