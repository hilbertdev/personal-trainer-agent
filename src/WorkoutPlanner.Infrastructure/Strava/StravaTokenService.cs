using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WorkoutPlanner.Application.Strava;
using WorkoutPlanner.Domain.Entities;
using WorkoutPlanner.Domain.Interfaces;

namespace WorkoutPlanner.Infrastructure.Strava;

public sealed class StravaTokenService(
    HttpClient httpClient,
    IOptions<StravaOptions> options,
    IStravaConnectionRepository connectionRepository,
    ILogger<StravaTokenService> logger) : IStravaTokenService
{
    private static readonly TimeSpan RefreshWindow = TimeSpan.FromMinutes(5);
    private static readonly ConcurrentDictionary<long, SemaphoreSlim> RefreshLocks = new();
    private readonly StravaOptions _options = options.Value;

    public async Task<string> GetValidAccessTokenAsync(long athleteId, CancellationToken cancellationToken = default)
    {
        var connection = await connectionRepository.GetByAthleteIdAsync(athleteId, cancellationToken)
            ?? throw new StravaConnectionNotFoundException(athleteId);

        if (!RequiresRefresh(connection))
        {
            return connection.AccessToken;
        }

        var refreshLock = RefreshLocks.GetOrAdd(athleteId, _ => new SemaphoreSlim(1, 1));
        await refreshLock.WaitAsync(cancellationToken);

        try
        {
            connection = await connectionRepository.GetByAthleteIdAsync(athleteId, cancellationToken)
                ?? throw new StravaConnectionNotFoundException(athleteId);

            if (!RequiresRefresh(connection))
            {
                return connection.AccessToken;
            }

            var tokenResponse = await RefreshTokenAsync(connection, cancellationToken);
            connection.AccessToken = tokenResponse.AccessToken;
            connection.RefreshToken = tokenResponse.RefreshToken;
            connection.ExpiresAtUtc = DateTimeOffset.FromUnixTimeSeconds(tokenResponse.ExpiresAt).UtcDateTime;
            connection.UpdatedAtUtc = DateTime.UtcNow;

            await connectionRepository.SaveAsync(connection, cancellationToken);
            logger.LogInformation(
                "Refreshed Strava access token for athlete {AthleteId}. Expires at {ExpiresAtUtc}.",
                athleteId,
                connection.ExpiresAtUtc);

            return connection.AccessToken;
        }
        finally
        {
            refreshLock.Release();
        }
    }

    private async Task<StravaTokenRefreshResponse> RefreshTokenAsync(
        StravaConnection connection,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await httpClient.PostAsJsonAsync(
                "https://www.strava.com/oauth/token",
                new
                {
                    client_id = _options.ClientId,
                    client_secret = _options.ClientSecret,
                    grant_type = "refresh_token",
                    refresh_token = connection.RefreshToken
                },
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var statusCode = (int)response.StatusCode;
                logger.LogWarning(
                    "Strava token refresh failed for athlete {AthleteId} with status code {StatusCode}.",
                    connection.AthleteId,
                    statusCode);
                throw new StravaApiException("Strava token refresh failed.", statusCode);
            }

            var tokenResponse = await response.Content.ReadFromJsonAsync<StravaTokenRefreshResponse>(
                cancellationToken: cancellationToken);

            if (tokenResponse is null
                || string.IsNullOrWhiteSpace(tokenResponse.AccessToken)
                || string.IsNullOrWhiteSpace(tokenResponse.RefreshToken))
            {
                logger.LogWarning(
                    "Strava token refresh returned an incomplete response for athlete {AthleteId}.",
                    connection.AthleteId);
                throw new StravaApiException("Strava token refresh returned an incomplete response.", (int)HttpStatusCode.BadGateway);
            }

            return tokenResponse;
        }
        catch (StravaIntegrationException)
        {
            throw;
        }
        catch (HttpRequestException exception)
        {
            logger.LogError(exception, "Network failure occurred during Strava token refresh for athlete {AthleteId}.", connection.AthleteId);
            throw new StravaApiException("Network failure occurred during Strava token refresh.", (int)HttpStatusCode.BadGateway, exception);
        }
    }

    private static bool RequiresRefresh(StravaConnection connection)
    {
        return connection.ExpiresAtUtc <= DateTime.UtcNow.Add(RefreshWindow);
    }

    private sealed class StravaTokenRefreshResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; init; } = string.Empty;

        [JsonPropertyName("refresh_token")]
        public string RefreshToken { get; init; } = string.Empty;

        [JsonPropertyName("expires_at")]
        public long ExpiresAt { get; init; }
    }
}
