namespace Training.Application.Providers;

public sealed record ProviderAthlete(
    string ProviderAthleteId,
    string ProviderName,
    string DisplayName,
    string? Email,
    string? TimeZone);
