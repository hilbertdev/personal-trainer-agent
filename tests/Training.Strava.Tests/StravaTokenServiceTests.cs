using FluentAssertions;
using Training.Strava.OAuth;

namespace Training.Strava.Tests;

public sealed class StravaTokenServiceTests
{
    [Fact]
    public async Task ExchangeAuthorizationCodeAsync_PostsExpectedFormFields()
    {
        var handler = new MockHttpMessageHandler(_ => MockHttp.JsonResponse("""
            {
              "access_token": "access",
              "refresh_token": "refresh",
              "expires_at": 1234567890
            }
            """));
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://www.strava.com/") };
        var service = new StravaTokenService(httpClient);

        var tokenSet = await service.ExchangeAuthorizationCodeAsync("client", "secret", "code-123");

        tokenSet.Should().NotBeNull();
        tokenSet!.AccessToken.Should().Be("access");
        handler.Requests.Should().ContainSingle();
        handler.RequestBodies[0].Should().Contain("grant_type=authorization_code");
        handler.RequestBodies[0].Should().Contain("code=code-123");
    }

    [Fact]
    public async Task RefreshTokenAsync_PostsRefreshGrantType()
    {
        var handler = new MockHttpMessageHandler(_ => MockHttp.JsonResponse("""
            {
              "access_token": "new-access",
              "refresh_token": "new-refresh",
              "expires_at": 1234567890
            }
            """));
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://www.strava.com/") };
        var service = new StravaTokenService(httpClient);

        var tokenSet = await service.RefreshTokenAsync("client", "secret", "refresh-token");

        tokenSet!.RefreshToken.Should().Be("new-refresh");
        handler.RequestBodies[0].Should().Contain("grant_type=refresh_token");
        handler.RequestBodies[0].Should().Contain("refresh_token=refresh-token");
    }
}
