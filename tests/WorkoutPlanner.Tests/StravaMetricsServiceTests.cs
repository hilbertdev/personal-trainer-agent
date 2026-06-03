using WorkoutPlanner.Application.Strava;

namespace WorkoutPlanner.Tests;

public sealed class StravaMetricsServiceTests
{
    [Fact]
    public async Task GetMetricsAsync_CalculatesDashboardMetricsFromRecentActivities()
    {
        var now = new DateTimeOffset(2026, 6, 3, 12, 0, 0, TimeSpan.Zero);
        var client = new RecordingStravaClient(
            new StravaActivityDto(
                1,
                "Tempo Run",
                Distance: 10_000,
                MovingTime: 3_000,
                ElapsedTime: 3_100,
                TotalElevationGain: 120,
                AverageSpeed: 3.33,
                MaxSpeed: 5.2,
                AverageHeartrate: 150,
                MaxHeartrate: 175,
                StartDate: now.AddDays(-2).UtcDateTime,
                SportType: "Run"),
            new StravaActivityDto(
                2,
                "Long Run",
                Distance: 20_000,
                MovingTime: 7_200,
                ElapsedTime: 7_500,
                TotalElevationGain: 300,
                AverageSpeed: 2.78,
                MaxSpeed: 4.8,
                AverageHeartrate: 140,
                MaxHeartrate: 168,
                StartDate: now.AddDays(-20).UtcDateTime,
                SportType: "Run"),
            new StravaActivityDto(
                3,
                "Old Run",
                Distance: 50_000,
                MovingTime: 18_000,
                ElapsedTime: 18_500,
                TotalElevationGain: 600,
                AverageSpeed: 2.78,
                MaxSpeed: 4.8,
                AverageHeartrate: 135,
                MaxHeartrate: 160,
                StartDate: now.AddDays(-40).UtcDateTime,
                SportType: "Run"));
        var service = new StravaMetricsService(client, new FixedTimeProvider(now));

        var metrics = await service.GetMetricsAsync(123);

        Assert.Equal(10, metrics.WeeklyDistanceKm);
        Assert.Equal(30, metrics.MonthlyDistanceKm);
        Assert.Equal(5.666666666666667, metrics.AveragePaceMinutesPerKm, precision: 6);
        Assert.Equal(2, metrics.ActivitiesLast30Days);
        Assert.Equal(145, metrics.AverageHeartRate);
        Assert.Equal(420, metrics.TotalElevationGain);
        Assert.Equal(TimeSpan.FromSeconds(10_200), metrics.TotalTrainingTime);
        Assert.Equal(123, client.AthleteId);
        Assert.Equal(now.AddDays(-30).UtcDateTime, client.After);
    }

    [Fact]
    public async Task GetMetricsAsync_ReturnsZeroMetrics_WhenThereAreNoRecentActivities()
    {
        var now = new DateTimeOffset(2026, 6, 3, 12, 0, 0, TimeSpan.Zero);
        var client = new RecordingStravaClient(
            new StravaActivityDto(
                1,
                "Old Run",
                Distance: 5_000,
                MovingTime: 1_800,
                ElapsedTime: 1_900,
                TotalElevationGain: 60,
                AverageSpeed: 2.7,
                MaxSpeed: 3.5,
                AverageHeartrate: 130,
                MaxHeartrate: 150,
                StartDate: now.AddDays(-31).UtcDateTime,
                SportType: "Run"));
        var service = new StravaMetricsService(client, new FixedTimeProvider(now));

        var metrics = await service.GetMetricsAsync(123);

        Assert.Equal(0, metrics.WeeklyDistanceKm);
        Assert.Equal(0, metrics.MonthlyDistanceKm);
        Assert.Equal(0, metrics.AveragePaceMinutesPerKm);
        Assert.Equal(0, metrics.ActivitiesLast30Days);
        Assert.Equal(0, metrics.AverageHeartRate);
        Assert.Equal(0, metrics.TotalElevationGain);
        Assert.Equal(TimeSpan.Zero, metrics.TotalTrainingTime);
    }

    private sealed class RecordingStravaClient(params StravaActivityDto[] activities) : IStravaClient
    {
        public long AthleteId { get; private set; }

        public DateTime? After { get; private set; }

        public Task<StravaAthleteDto> GetAthleteAsync(long athleteId, CancellationToken cancellationToken = default)
        {
            throw new NotSupportedException();
        }

        public Task<IReadOnlyList<StravaActivityDto>> GetActivitiesAsync(
            long athleteId,
            int page = 1,
            int perPage = 200,
            DateTime? before = null,
            DateTime? after = null,
            CancellationToken cancellationToken = default)
        {
            AthleteId = athleteId;
            After = after;
            return Task.FromResult<IReadOnlyList<StravaActivityDto>>(activities);
        }
    }

    private sealed class FixedTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow()
        {
            return utcNow;
        }
    }
}
