using System.Text.Json.Serialization;

namespace Training.Strava.Models;

internal sealed record StravaActivityResponse(
    [property: JsonPropertyName("id")] long Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("sport_type")] string? SportType,
    [property: JsonPropertyName("type")] string? Type,
    [property: JsonPropertyName("start_date")] DateTimeOffset StartedAt,
    [property: JsonPropertyName("elapsed_time")] int ElapsedSeconds,
    [property: JsonPropertyName("distance")] double? DistanceMeters,
    [property: JsonPropertyName("average_heartrate")] double? AverageHeartRate,
    [property: JsonPropertyName("relative_effort")] int? RelativeEffort);
