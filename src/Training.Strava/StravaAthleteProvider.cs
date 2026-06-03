using Training.Application.Abstractions;
using Training.Application.Providers;

namespace Training.Strava;

public sealed class StravaAthleteProvider(StravaClient client) : IAthleteProvider
{
    private const string ProviderName = "Strava";

    public async Task<ProviderAthlete?> GetAthleteAsync(
        Guid athleteId,
        CancellationToken cancellationToken = default)
    {
        var athlete = await client.GetAthleteAsync(cancellationToken);

        if (athlete is null)
        {
            return null;
        }

        var displayName = string.Join(
            ' ',
            new[] { athlete.FirstName, athlete.LastName }.Where(part => !string.IsNullOrWhiteSpace(part)));

        return new ProviderAthlete(
            athlete.Id.ToString(),
            ProviderName,
            string.IsNullOrWhiteSpace(displayName) ? ProviderName : displayName,
            athlete.Email,
            athlete.TimeZone);
    }
}
