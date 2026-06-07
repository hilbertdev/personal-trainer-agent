using FluentAssertions;
using Training.Strava.OAuth;

namespace Training.Strava.Tests;

public sealed class StravaOAuthServiceTests
{
    [Fact]
    public void BuildAuthorizationUri_IncludesRequiredQueryParameters()
    {
        var service = new StravaOAuthService();
        var redirectUri = new Uri("https://example.com/callback");

        var uri = service.BuildAuthorizationUri(
            "client-123",
            redirectUri,
            "state-abc",
            ["read", "activity:read"]);

        uri.Query.Should().Contain("client_id=client-123");
        uri.Query.Should().Contain("redirect_uri=");
        uri.Query.Should().Contain("response_type=code");
        uri.Query.Should().Contain("scope=read%2Cactivity%3Aread");
        uri.Query.Should().Contain("state=state-abc");
        uri.AbsoluteUri.Should().StartWith("https://www.strava.com/oauth/authorize?");
    }
}
