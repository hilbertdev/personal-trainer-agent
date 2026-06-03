namespace WorkoutPlanner.Infrastructure.Strava;

public sealed class StravaOptions
{
    public const string SectionName = "Strava";

    public string ClientId { get; set; } = string.Empty;

    public string ClientSecret { get; set; } = string.Empty;

    public string RedirectUri { get; set; } = "https://localhost:5001/api/strava/callback";
}
