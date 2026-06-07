using FluentAssertions;
using Training.Strava;

namespace Training.Strava.Tests;

public sealed class StravaClientTests
{
    [Fact]
    public async Task GetActivitiesAsync_BuildsDateRangeQueryAndDeserializesActivities()
    {
        var json = """
                   [
                     {
                       "id": 123,
                       "name": "Morning Run",
                       "sport_type": "Run",
                       "start_date": "2026-02-01T08:00:00Z",
                       "elapsed_time": 2700,
                       "distance": 10000.0,
                       "average_heartrate": 150.4,
                       "relative_effort": 55
                     }
                   ]
                   """;
        var handler = new MockHttpMessageHandler(_ => MockHttp.JsonResponse(json));
        var client = new HttpClient(handler) { BaseAddress = new Uri("https://www.strava.com/api/v3/") };
        var stravaClient = new StravaClient(client);

        var activities = await stravaClient.GetActivitiesAsync(
            new DateOnly(2026, 2, 1),
            new DateOnly(2026, 2, 1));

        handler.Requests.Should().ContainSingle();
        handler.Requests[0].RequestUri!.Query.Should().Contain("after=");
        handler.Requests[0].RequestUri!.Query.Should().Contain("before=");
        activities.Should().ContainSingle();
        activities[0].Name.Should().Be("Morning Run");
        activities[0].SportType.Should().Be("Run");
    }

    [Fact]
    public async Task GetAthleteAsync_DeserializesAthlete()
    {
        var json = """
                   {
                     "id": 42,
                     "firstname": "Alex",
                     "lastname": "Runner",
                     "email": "alex@example.com",
                     "timezone": "America/New_York"
                   }
                   """;
        var handler = new MockHttpMessageHandler(_ => MockHttp.JsonResponse(json));
        var client = new HttpClient(handler) { BaseAddress = new Uri("https://www.strava.com/api/v3/") };
        var stravaClient = new StravaClient(client);

        var athlete = await stravaClient.GetAthleteAsync();

        athlete.Should().NotBeNull();
        athlete!.FirstName.Should().Be("Alex");
        athlete.LastName.Should().Be("Runner");
    }
}
