namespace WorkoutPlanner.Application.Strava;

public sealed class StravaMetricsService(
    IStravaClient stravaClient,
    TimeProvider timeProvider) : IStravaMetricsService
{
    private const double MetersPerKilometer = 1000d;
    private const double SecondsPerMinute = 60d;

    public async Task<RunnerMetrics> GetMetricsAsync(long athleteId, CancellationToken cancellationToken = default)
    {
        var now = timeProvider.GetUtcNow().UtcDateTime;
        var thirtyDaysAgo = now.AddDays(-30);
        var sevenDaysAgo = now.AddDays(-7);
        var recentActivities = await stravaClient.GetActivitiesAsync(
            athleteId,
            page: 1,
            perPage: 200,
            after: thirtyDaysAgo,
            cancellationToken: cancellationToken);

        var activitiesLast30Days = recentActivities
            .Where(activity => activity.StartDate.ToUniversalTime() >= thirtyDaysAgo)
            .ToList();
        var activitiesLast7Days = activitiesLast30Days
            .Where(activity => activity.StartDate.ToUniversalTime() >= sevenDaysAgo)
            .ToList();

        var monthlyDistanceKm = activitiesLast30Days.Sum(activity => activity.Distance) / MetersPerKilometer;
        var totalMovingSeconds = activitiesLast30Days.Sum(activity => activity.MovingTime);
        var heartRates = activitiesLast30Days
            .Where(activity => activity.AverageHeartrate.HasValue)
            .Select(activity => activity.AverageHeartrate!.Value)
            .ToList();

        return new RunnerMetrics
        {
            WeeklyDistanceKm = activitiesLast7Days.Sum(activity => activity.Distance) / MetersPerKilometer,
            MonthlyDistanceKm = monthlyDistanceKm,
            AveragePaceMinutesPerKm = monthlyDistanceKm <= 0
                ? 0
                : totalMovingSeconds / SecondsPerMinute / monthlyDistanceKm,
            ActivitiesLast30Days = activitiesLast30Days.Count,
            AverageHeartRate = heartRates.Count is 0 ? 0 : heartRates.Average(),
            TotalElevationGain = activitiesLast30Days.Sum(activity => activity.TotalElevationGain),
            TotalTrainingTime = TimeSpan.FromSeconds(totalMovingSeconds)
        };
    }
}
