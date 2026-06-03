using Training.Application.Abstractions;
using Training.Application.Providers;
using Training.Strava.Models;

namespace Training.Strava;

public sealed class StravaActivityProvider(StravaClient client) : IActivityProvider
{
    private const string ProviderName = "Strava";

    public async Task<IReadOnlyList<ProviderActivity>> GetActivitiesAsync(
        Guid athleteId,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken = default)
    {
        var activities = await client.GetActivitiesAsync(from, to, cancellationToken);

        return activities
            .Select(activity => ToProviderActivity(athleteId, activity))
            .ToList();
    }

    private static ProviderActivity ToProviderActivity(Guid athleteId, StravaActivityResponse activity)
    {
        var sport = activity.SportType ?? activity.Type ?? "Unknown";

        return new ProviderActivity(
            activity.Id.ToString(),
            ProviderName,
            athleteId,
            activity.StartedAt,
            TimeSpan.FromSeconds(activity.ElapsedSeconds),
            sport,
            sport,
            activity.DistanceMeters,
            activity.AverageHeartRate is null ? null : (int)Math.Round(activity.AverageHeartRate.Value),
            activity.RelativeEffort,
            activity.Name);
    }
}
