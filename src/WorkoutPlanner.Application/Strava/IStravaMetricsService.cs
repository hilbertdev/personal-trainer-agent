namespace WorkoutPlanner.Application.Strava;

public interface IStravaMetricsService
{
    Task<RunnerMetrics> GetMetricsAsync(long athleteId, CancellationToken cancellationToken = default);
}
