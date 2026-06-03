using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace Training.Strava.OAuth;

public sealed class StravaTokenService(HttpClient httpClient)
{
    public async Task<StravaTokenSet?> ExchangeAuthorizationCodeAsync(
        string clientId,
        string clientSecret,
        string authorizationCode,
        CancellationToken cancellationToken = default)
    {
        using var request = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = clientId,
            ["client_secret"] = clientSecret,
            ["code"] = authorizationCode,
            ["grant_type"] = "authorization_code"
        });

        using var response = await httpClient.PostAsync("oauth/token", request, cancellationToken);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<StravaTokenSet>(cancellationToken);
    }

    public async Task<StravaTokenSet?> RefreshTokenAsync(
        string clientId,
        string clientSecret,
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        using var request = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = clientId,
            ["client_secret"] = clientSecret,
            ["refresh_token"] = refreshToken,
            ["grant_type"] = "refresh_token"
        });

        using var response = await httpClient.PostAsync("oauth/token", request, cancellationToken);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<StravaTokenSet>(cancellationToken);
    }
}

public sealed record StravaTokenSet(
    [property: JsonPropertyName("access_token")] string AccessToken,
    [property: JsonPropertyName("refresh_token")] string RefreshToken,
    [property: JsonPropertyName("expires_at")] long ExpiresAtUnixSeconds);
