namespace WorkoutPlanner.Application.Strava;

public sealed record StravaAthleteDto(
    long Id,
    string? Username,
    string? Firstname,
    string? Lastname,
    string? City,
    string? State,
    string? Country,
    double? Weight);
