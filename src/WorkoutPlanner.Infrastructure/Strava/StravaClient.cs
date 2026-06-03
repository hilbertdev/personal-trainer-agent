using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using WorkoutPlanner.Application.Strava;

namespace WorkoutPlanner.Infrastructure.Strava;

public sealed class StravaClient(
    HttpClient httpClient,
    IStravaTokenService tokenService,
    ILogger<StravaClient> logger) : IStravaClient
{
    public async Task<StravaAthleteDto> GetAthleteAsync(long athleteId, CancellationToken cancellationToken = default)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "athlete");
        var response = await SendAsync(athleteId, request, cancellationToken);
        var athlete = await response.Content.ReadFromJsonAsync<StravaAthleteResponse>(cancellationToken: cancellationToken);

        if (athlete is null)
        {
            throw new StravaApiException("Strava athlete response was empty.", (int)HttpStatusCode.BadGateway);
        }

        return new StravaAthleteDto(
            athlete.Id,
            athlete.Username,
            athlete.Firstname,
            athlete.Lastname,
            athlete.City,
            athlete.State,
            athlete.Country,
            athlete.Weight);
    }

    public async Task<IReadOnlyList<StravaActivityDto>> GetActivitiesAsync(
        long athleteId,
        int page = 1,
        int perPage = 200,
        DateTime? before = null,
        DateTime? after = null,
        CancellationToken cancellationToken = default)
    {
        var query = new Dictionary<string, string>
        {
            ["page"] = Math.Max(1, page).ToString(CultureInfo.InvariantCulture),
            ["per_page"] = Math.Clamp(perPage, 1, 200).ToString(CultureInfo.InvariantCulture)
        };

        if (before.HasValue)
        {
            query["before"] = ToUnixSeconds(before.Value).ToString(CultureInfo.InvariantCulture);
        }

        if (after.HasValue)
        {
            query["after"] = ToUnixSeconds(after.Value).ToString(CultureInfo.InvariantCulture);
        }

        var requestUri = $"athlete/activities?{BuildQueryString(query)}";
        var request = new HttpRequestMessage(HttpMethod.Get, requestUri);
        var response = await SendAsync(athleteId, request, cancellationToken);
        var activities = await response.Content.ReadFromJsonAsync<List<StravaActivityResponse>>(
            cancellationToken: cancellationToken);

        return activities?
            .Select(activity => new StravaActivityDto(
                activity.Id,
                activity.Name ?? string.Empty,
                activity.Distance,
                activity.MovingTime,
                activity.ElapsedTime,
                activity.TotalElevationGain,
                activity.AverageSpeed,
                activity.MaxSpeed,
                activity.AverageHeartrate,
                activity.MaxHeartrate,
                activity.StartDate,
                activity.SportType ?? string.Empty))
            .ToList()
            ?? [];
    }

    private async Task<HttpResponseMessage> SendAsync(
        long athleteId,
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var accessToken = await tokenService.GetValidAccessTokenAsync(athleteId, cancellationToken);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        try
        {
            logger.LogInformation(
                "Sending Strava API request {Method} {Path} for athlete {AthleteId}.",
                request.Method,
                request.RequestUri,
                athleteId);
            var response = await httpClient.SendAsync(request, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                return response;
            }

            var statusCode = (int)response.StatusCode;
            var message = response.StatusCode switch
            {
                HttpStatusCode.Unauthorized => "Strava rejected the access token.",
                HttpStatusCode.TooManyRequests => "Strava rate limit was exceeded.",
                _ => "Strava API request failed."
            };

            logger.LogWarning(
                "Strava API request {Method} {Path} for athlete {AthleteId} failed with status code {StatusCode}.",
                request.Method,
                request.RequestUri,
                athleteId,
                statusCode);
            throw new StravaApiException(message, statusCode);
        }
        catch (StravaIntegrationException)
        {
            throw;
        }
        catch (HttpRequestException exception)
        {
            logger.LogError(
                exception,
                "Network failure occurred during Strava API request {Method} {Path} for athlete {AthleteId}.",
                request.Method,
                request.RequestUri,
                athleteId);
            throw new StravaApiException("Network failure occurred during Strava API request.", (int)HttpStatusCode.BadGateway, exception);
        }
    }

    private static long ToUnixSeconds(DateTime value)
    {
        return new DateTimeOffset(value.ToUniversalTime()).ToUnixTimeSeconds();
    }

    private static string BuildQueryString(IReadOnlyDictionary<string, string> values)
    {
        return string.Join(
            '&',
            values.Select(pair => $"{Uri.EscapeDataString(pair.Key)}={Uri.EscapeDataString(pair.Value)}"));
    }

    private sealed class StravaAthleteResponse
    {
        [JsonPropertyName("id")]
        public long Id { get; init; }

        [JsonPropertyName("username")]
        public string? Username { get; init; }

        [JsonPropertyName("firstname")]
        public string? Firstname { get; init; }

        [JsonPropertyName("lastname")]
        public string? Lastname { get; init; }

        [JsonPropertyName("city")]
        public string? City { get; init; }

        [JsonPropertyName("state")]
        public string? State { get; init; }

        [JsonPropertyName("country")]
        public string? Country { get; init; }

        [JsonPropertyName("weight")]
        public double? Weight { get; init; }
    }

    private sealed class StravaActivityResponse
    {
        [JsonPropertyName("id")]
        public long Id { get; init; }

        [JsonPropertyName("name")]
        public string? Name { get; init; }

        [JsonPropertyName("distance")]
        public double Distance { get; init; }

        [JsonPropertyName("moving_time")]
        public int MovingTime { get; init; }

        [JsonPropertyName("elapsed_time")]
        public int ElapsedTime { get; init; }

        [JsonPropertyName("total_elevation_gain")]
        public double TotalElevationGain { get; init; }

        [JsonPropertyName("average_speed")]
        public double AverageSpeed { get; init; }

        [JsonPropertyName("max_speed")]
        public double MaxSpeed { get; init; }

        [JsonPropertyName("average_heartrate")]
        public double? AverageHeartrate { get; init; }

        [JsonPropertyName("max_heartrate")]
        public double? MaxHeartrate { get; init; }

        [JsonPropertyName("start_date")]
        public DateTime StartDate { get; init; }

        [JsonPropertyName("sport_type")]
        public string? SportType { get; init; }
    }
}
