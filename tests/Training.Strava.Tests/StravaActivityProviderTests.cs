using FluentAssertions;
using Training.Strava;

namespace Training.Strava.Tests;

public sealed class StravaActivityProviderTests
{
    [Fact]
    public async Task GetActivitiesAsync_UsesSportTypeFallbackAndRoundsHeartRate()
    {
        var athleteId = Guid.NewGuid();
        var json = """
                   [
                     {
                       "id": 999,
                       "name": "Evening Ride",
                       "type": "Ride",
                       "start_date": "2026-03-01T18:00:00Z",
                       "elapsed_time": 3600,
                       "average_heartrate": 151.6
                     }
                   ]
                   """;
        var client = new StravaClient(MockHttp.CreateClient(_ => MockHttp.JsonResponse(json)));
        var provider = new StravaActivityProvider(client);

        var activities = await provider.GetActivitiesAsync(
            athleteId,
            new DateOnly(2026, 3, 1),
            new DateOnly(2026, 3, 1));

        activities.Should().ContainSingle();
        activities[0].ProviderName.Should().Be("Strava");
        activities[0].Sport.Should().Be("Ride");
        activities[0].AverageHeartRate.Should().Be(152);
        activities[0].DistanceMeters.Should().BeNull();
    }
}
