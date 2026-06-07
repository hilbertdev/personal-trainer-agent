using FluentAssertions;
using Training.Strava;

namespace Training.Strava.Tests;

public sealed class StravaAthleteProviderTests
{
    [Fact]
    public async Task GetAthleteAsync_BuildsDisplayName()
    {
        var json = """
                   {
                     "id": 7,
                     "firstname": "Jamie",
                     "lastname": "Fox",
                     "email": "jamie@example.com",
                     "timezone": "Europe/London"
                   }
                   """;
        var client = new StravaClient(MockHttp.CreateClient(_ => MockHttp.JsonResponse(json)));
        var provider = new StravaAthleteProvider(client);

        var athlete = await provider.GetAthleteAsync(Guid.NewGuid());

        athlete.Should().NotBeNull();
        athlete!.DisplayName.Should().Be("Jamie Fox");
        athlete.Email.Should().Be("jamie@example.com");
    }

    [Fact]
    public async Task GetAthleteAsync_FallsBackToProviderNameWhenNamesMissing()
    {
        var json = """
                   {
                     "id": 7,
                     "firstname": "",
                     "lastname": "",
                     "email": null,
                     "timezone": null
                   }
                   """;
        var client = new StravaClient(MockHttp.CreateClient(_ => MockHttp.JsonResponse(json)));
        var provider = new StravaAthleteProvider(client);

        var athlete = await provider.GetAthleteAsync(Guid.NewGuid());

        athlete!.DisplayName.Should().Be("Strava");
    }

    [Fact]
    public async Task GetAthleteAsync_ReturnsNullWhenResponseMissing()
    {
        var client = new StravaClient(MockHttp.CreateClient(_ => MockHttp.JsonResponse("null")));
        var provider = new StravaAthleteProvider(client);

        var athlete = await provider.GetAthleteAsync(Guid.NewGuid());

        athlete.Should().BeNull();
    }
}
