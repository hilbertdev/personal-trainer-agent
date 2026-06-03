namespace WorkoutPlanner.Application.Strava;

public sealed record StravaActivityDto(
    long ActivityId,
    string Name,
    double Distance,
    int MovingTime,
    int ElapsedTime,
    double TotalElevationGain,
    double AverageSpeed,
    double MaxSpeed,
    double? AverageHeartrate,
    double? MaxHeartrate,
    DateTime StartDate,
    string SportType);
