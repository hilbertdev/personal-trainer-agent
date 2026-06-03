namespace Training.Application.Providers;

public sealed record ProviderActivity(
    string ProviderActivityId,
    string ProviderName,
    Guid? AthleteId,
    DateTimeOffset StartedAt,
    TimeSpan Duration,
    string Sport,
    string Category,
    double? DistanceMeters,
    int? AverageHeartRate,
    int? RelativeEffort,
    string? Notes);
