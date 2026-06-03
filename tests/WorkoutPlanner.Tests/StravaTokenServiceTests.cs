using System.Net;
using System.Text;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using WorkoutPlanner.Application.Strava;
using WorkoutPlanner.Domain.Entities;
using WorkoutPlanner.Domain.Interfaces;
using WorkoutPlanner.Infrastructure.Strava;

namespace WorkoutPlanner.Tests;

public sealed class StravaTokenServiceTests
{
    [Fact]
    public async Task GetValidAccessTokenAsync_ReturnsExistingToken_WhenTokenIsNotExpiring()
    {
        var repository = new InMemoryStravaConnectionRepository(new StravaConnection
        {
            Id = Guid.NewGuid(),
            AthleteId = 123,
            AccessToken = "current-access-token",
            RefreshToken = "current-refresh-token",
            ExpiresAtUtc = DateTime.UtcNow.AddHours(1),
            CreatedAtUtc = DateTime.UtcNow.AddDays(-1),
            UpdatedAtUtc = DateTime.UtcNow.AddDays(-1)
        });
        var handler = new RecordingHttpMessageHandler(_ => throw new InvalidOperationException("Refresh should not be called."));
        var service = CreateService(repository, handler);

        var accessToken = await service.GetValidAccessTokenAsync(123);

        Assert.Equal("current-access-token", accessToken);
        Assert.Equal(0, handler.RequestCount);
        Assert.Equal("current-access-token", repository.Connection!.AccessToken);
    }

    [Fact]
    public async Task GetValidAccessTokenAsync_RefreshesAndPersistsToken_WhenTokenIsExpiring()
    {
        var expiresAt = DateTimeOffset.UtcNow.AddHours(2).ToUnixTimeSeconds();
        var repository = new InMemoryStravaConnectionRepository(new StravaConnection
        {
            Id = Guid.NewGuid(),
            AthleteId = 456,
            AccessToken = "expired-access-token",
            RefreshToken = "refresh-token",
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(2),
            CreatedAtUtc = DateTime.UtcNow.AddDays(-1),
            UpdatedAtUtc = DateTime.UtcNow.AddDays(-1)
        });
        var handler = new RecordingHttpMessageHandler(request =>
        {
            Assert.Equal(HttpMethod.Post, request.Method);
            Assert.Equal("https://www.strava.com/oauth/token", request.RequestUri!.ToString());

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    $$"""
                    {
                      "access_token": "new-access-token",
                      "refresh_token": "new-refresh-token",
                      "expires_at": {{expiresAt}}
                    }
                    """,
                    Encoding.UTF8,
                    "application/json")
            };
        });
        var service = CreateService(repository, handler);

        var accessToken = await service.GetValidAccessTokenAsync(456);

        Assert.Equal("new-access-token", accessToken);
        Assert.Equal(1, handler.RequestCount);
        Assert.Equal("new-access-token", repository.Connection!.AccessToken);
        Assert.Equal("new-refresh-token", repository.Connection.RefreshToken);
        Assert.Equal(DateTimeOffset.FromUnixTimeSeconds(expiresAt).UtcDateTime, repository.Connection.ExpiresAtUtc);
    }

    private static StravaTokenService CreateService(
        IStravaConnectionRepository repository,
        HttpMessageHandler handler)
    {
        return new StravaTokenService(
            new HttpClient(handler),
            Options.Create(new StravaOptions
            {
                ClientId = "client-id",
                ClientSecret = "client-secret",
                RedirectUri = "https://localhost:5001/api/strava/callback"
            }),
            repository,
            NullLogger<StravaTokenService>.Instance);
    }

    private sealed class InMemoryStravaConnectionRepository(StravaConnection? connection) : IStravaConnectionRepository
    {
        public StravaConnection? Connection { get; private set; } = Clone(connection);

        public Task<StravaConnection?> GetByAthleteIdAsync(long athleteId, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(Connection?.AthleteId == athleteId ? Clone(Connection) : null);
        }

        public Task<StravaConnection?> GetMostRecentAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult(Clone(Connection));
        }

        public Task SaveAsync(StravaConnection connection, CancellationToken cancellationToken = default)
        {
            Connection = Clone(connection);
            return Task.CompletedTask;
        }

        private static StravaConnection? Clone(StravaConnection? source)
        {
            return source is null
                ? null
                : new StravaConnection
                {
                    Id = source.Id,
                    AthleteId = source.AthleteId,
                    AccessToken = source.AccessToken,
                    RefreshToken = source.RefreshToken,
                    ExpiresAtUtc = source.ExpiresAtUtc,
                    CreatedAtUtc = source.CreatedAtUtc,
                    UpdatedAtUtc = source.UpdatedAtUtc
                };
        }
    }

    private sealed class RecordingHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responseFactory)
        : HttpMessageHandler
    {
        public int RequestCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            RequestCount++;
            return Task.FromResult(responseFactory(request));
        }
    }
}
