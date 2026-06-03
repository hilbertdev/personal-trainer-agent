using System.Net.Http.Json;
using Training.Strava.Models;

namespace Training.Strava;

public sealed class StravaClient(HttpClient httpClient)
{
    internal async Task<IReadOnlyList<StravaActivityResponse>> GetActivitiesAsync(
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken = default)
    {
        var after = ToUnixSeconds(from.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));
        var before = ToUnixSeconds(to.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));
        var activities = await httpClient.GetFromJsonAsync<List<StravaActivityResponse>>(
            $"athlete/activities?after={after}&before={before}",
            cancellationToken);

        return activities ?? [];
    }

    internal async Task<StravaAthleteResponse?> GetAthleteAsync(CancellationToken cancellationToken = default)
    {
        return await httpClient.GetFromJsonAsync<StravaAthleteResponse>("athlete", cancellationToken);
    }

    private static long ToUnixSeconds(DateTime dateTime)
    {
        return new DateTimeOffset(dateTime).ToUnixTimeSeconds();
    }
}
