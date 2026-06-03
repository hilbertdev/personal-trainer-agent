using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WorkoutPlanner.Application.Strava;
using WorkoutPlanner.Domain.Entities;
using WorkoutPlanner.Domain.Interfaces;

namespace WorkoutPlanner.Infrastructure.Strava;

public sealed class StravaOAuthService(
    HttpClient httpClient,
    IOptions<StravaOptions> options,
    IStravaConnectionRepository connectionRepository,
    ILogger<StravaOAuthService> logger) : IStravaOAuthService
{
    private static readonly string[] RequiredScopes = ["read", "activity:read_all"];
    private readonly StravaOptions _options = options.Value;

    public string GenerateAuthorizationUrl()
    {
        EnsureConfigured();

        var query = new Dictionary<string, string>
        {
            ["client_id"] = _options.ClientId,
            ["response_type"] = "code",
            ["redirect_uri"] = _options.RedirectUri,
            ["approval_prompt"] = "force",
            ["scope"] = string.Join(',', RequiredScopes)
        };

        return $"https://www.strava.com/oauth/authorize?{BuildQueryString(query)}";
    }

    public async Task<StravaConnection> ExchangeCodeAsync(
        string code,
        string? scope,
        CancellationToken cancellationToken = default)
    {
        EnsureConfigured();
        EnsureRequiredScopes(scope);

        try
        {
            var response = await httpClient.PostAsJsonAsync(
                "https://www.strava.com/oauth/token",
                new
                {
                    client_id = _options.ClientId,
                    client_secret = _options.ClientSecret,
                    code,
                    grant_type = "authorization_code"
                },
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var statusCode = (int)response.StatusCode;
                logger.LogWarning(
                    "Strava OAuth token exchange failed with status code {StatusCode}.",
                    statusCode);
                throw new StravaApiException("Strava OAuth token exchange failed.", statusCode);
            }

            var tokenResponse = await response.Content.ReadFromJsonAsync<StravaTokenExchangeResponse>(
                cancellationToken: cancellationToken);

            if (tokenResponse?.Athlete is null
                || string.IsNullOrWhiteSpace(tokenResponse.AccessToken)
                || string.IsNullOrWhiteSpace(tokenResponse.RefreshToken))
            {
                logger.LogWarning("Strava OAuth token exchange returned an incomplete response.");
                throw new StravaApiException("Strava OAuth token exchange returned an incomplete response.", (int)HttpStatusCode.BadGateway);
            }

            var now = DateTime.UtcNow;
            var connection = new StravaConnection
            {
                Id = Guid.NewGuid(),
                AthleteId = tokenResponse.Athlete.Id,
                AccessToken = tokenResponse.AccessToken,
                RefreshToken = tokenResponse.RefreshToken,
                ExpiresAtUtc = DateTimeOffset.FromUnixTimeSeconds(tokenResponse.ExpiresAt).UtcDateTime,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            };

            await connectionRepository.SaveAsync(connection, cancellationToken);
            logger.LogInformation(
                "Strava OAuth callback succeeded for athlete {AthleteId} with scopes {Scopes}.",
                connection.AthleteId,
                scope);

            return connection;
        }
        catch (StravaIntegrationException)
        {
            throw;
        }
        catch (HttpRequestException exception)
        {
            logger.LogError(exception, "Network failure occurred during Strava OAuth token exchange.");
            throw new StravaApiException("Network failure occurred during Strava OAuth token exchange.", (int)HttpStatusCode.BadGateway, exception);
        }
    }

    private void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(_options.ClientId)
            || string.IsNullOrWhiteSpace(_options.ClientSecret)
            || string.IsNullOrWhiteSpace(_options.RedirectUri))
        {
            throw new InvalidOperationException("Strava ClientId, ClientSecret, and RedirectUri must be configured.");
        }
    }

    private static void EnsureRequiredScopes(string? scope)
    {
        var scopes = (scope ?? string.Empty)
            .Split([',', ' '], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var requiredScope in RequiredScopes)
        {
            if (!scopes.Contains(requiredScope))
            {
                throw new StravaMissingScopeException(requiredScope);
            }
        }
    }

    private static string BuildQueryString(IReadOnlyDictionary<string, string> values)
    {
        return string.Join(
            '&',
            values.Select(pair => $"{Uri.EscapeDataString(pair.Key)}={Uri.EscapeDataString(pair.Value)}"));
    }

    private sealed class StravaTokenExchangeResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; init; } = string.Empty;

        [JsonPropertyName("refresh_token")]
        public string RefreshToken { get; init; } = string.Empty;

        [JsonPropertyName("expires_at")]
        public long ExpiresAt { get; init; }

        [JsonPropertyName("athlete")]
        public StravaAthleteResponse? Athlete { get; init; }
    }

    private sealed class StravaAthleteResponse
    {
        [JsonPropertyName("id")]
        public long Id { get; init; }
    }
}
