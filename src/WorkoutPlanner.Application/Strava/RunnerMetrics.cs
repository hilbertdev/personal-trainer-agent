namespace WorkoutPlanner.Application.Strava;

public sealed class RunnerMetrics
{
    public double WeeklyDistanceKm { get; set; }

    public double MonthlyDistanceKm { get; set; }

    public double AveragePaceMinutesPerKm { get; set; }

    public int ActivitiesLast30Days { get; set; }

    public double AverageHeartRate { get; set; }

    public double TotalElevationGain { get; set; }

    public TimeSpan TotalTrainingTime { get; set; }
}
