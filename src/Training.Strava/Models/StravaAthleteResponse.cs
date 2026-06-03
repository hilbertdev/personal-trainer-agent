using System.Text.Json.Serialization;

namespace Training.Strava.Models;

internal sealed record StravaAthleteResponse(
    [property: JsonPropertyName("id")] long Id,
    [property: JsonPropertyName("firstname")] string? FirstName,
    [property: JsonPropertyName("lastname")] string? LastName,
    [property: JsonPropertyName("email")] string? Email,
    [property: JsonPropertyName("timezone")] string? TimeZone);
