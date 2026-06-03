using Microsoft.AspNetCore.Mvc;
using WorkoutPlanner.Application.Strava;
using WorkoutPlanner.Domain.Interfaces;

namespace WorkoutPlanner.Api.Controllers;

[ApiController]
[Route("api/strava")]
public sealed class StravaController(
    IStravaOAuthService oauthService,
    IStravaClient stravaClient,
    IStravaMetricsService metricsService,
    IStravaConnectionRepository connectionRepository,
    ILogger<StravaController> logger) : ControllerBase
{
    [HttpGet("connect", Name = "GetStravaConnectUrl")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public ActionResult<object> Connect()
    {
        try
        {
            return Ok(new { authorizationUrl = oauthService.GenerateAuthorizationUrl() });
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Failed to generate Strava authorization URL.");
            return Problem(
                title: "Strava is not configured.",
                detail: "Strava ClientId, ClientSecret, and RedirectUri must be configured before connecting.",
                statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    [HttpGet("callback", Name = "HandleStravaOAuthCallback")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status502BadGateway)]
    public async Task<ActionResult<object>> Callback(
        [FromQuery] string? code,
        [FromQuery] string? scope,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            logger.LogWarning("Strava OAuth callback failed because no authorization code was provided.");
            return Problem(
                title: "Missing Strava authorization code.",
                detail: "The Strava callback must include a code query parameter.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        try
        {
            var connection = await oauthService.ExchangeCodeAsync(code, scope, cancellationToken);

            return Ok(new
            {
                connected = true,
                connection.AthleteId,
                scope
            });
        }
        catch (Exception exception)
        {
            return HandleStravaException(exception, "Strava OAuth callback failed.");
        }
    }

    [HttpGet("profile", Name = "GetStravaProfile")]
    [ProducesResponseType(typeof(StravaAthleteDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StravaAthleteDto>> Profile(
        [FromQuery] long? athleteId,
        CancellationToken cancellationToken)
    {
        try
        {
            var resolvedAthleteId = await ResolveAthleteIdAsync(athleteId, cancellationToken);
            var profile = await stravaClient.GetAthleteAsync(resolvedAthleteId, cancellationToken);

            return Ok(profile);
        }
        catch (Exception exception)
        {
            return HandleStravaException(exception, "Failed to fetch Strava athlete profile.");
        }
    }

    [HttpGet("activities", Name = "GetStravaActivities")]
    [ProducesResponseType(typeof(IReadOnlyList<StravaActivityDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<StravaActivityDto>>> Activities(
        [FromQuery] long? athleteId,
        [FromQuery] int page = 1,
        [FromQuery(Name = "per_page")] int perPage = 200,
        [FromQuery] DateTime? before = null,
        [FromQuery] DateTime? after = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var resolvedAthleteId = await ResolveAthleteIdAsync(athleteId, cancellationToken);
            var activities = await stravaClient.GetActivitiesAsync(
                resolvedAthleteId,
                page,
                perPage,
                before,
                after,
                cancellationToken);

            return Ok(activities);
        }
        catch (Exception exception)
        {
            return HandleStravaException(exception, "Failed to fetch Strava athlete activities.");
        }
    }

    [HttpGet("metrics", Name = "GetStravaMetrics")]
    [ProducesResponseType(typeof(RunnerMetrics), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RunnerMetrics>> Metrics(
        [FromQuery] long? athleteId,
        CancellationToken cancellationToken)
    {
        try
        {
            var resolvedAthleteId = await ResolveAthleteIdAsync(athleteId, cancellationToken);
            var metrics = await metricsService.GetMetricsAsync(resolvedAthleteId, cancellationToken);

            return Ok(metrics);
        }
        catch (Exception exception)
        {
            return HandleStravaException(exception, "Failed to calculate Strava athlete metrics.");
        }
    }

    private async Task<long> ResolveAthleteIdAsync(long? athleteId, CancellationToken cancellationToken)
    {
        if (athleteId.HasValue)
        {
            return athleteId.Value;
        }

        var connection = await connectionRepository.GetMostRecentAsync(cancellationToken)
            ?? throw new StravaNoConnectionException();

        return connection.AthleteId;
    }

    private ObjectResult HandleStravaException(Exception exception, string logMessage)
    {
        return exception switch
        {
            StravaMissingScopeException missingScopeException => Problem(
                title: "Missing Strava scope.",
                detail: missingScopeException.Message,
                statusCode: StatusCodes.Status400BadRequest),
            StravaConnectionNotFoundException or StravaNoConnectionException => Problem(
                title: "Strava connection not found.",
                detail: exception.Message,
                statusCode: StatusCodes.Status404NotFound),
            StravaApiException { StatusCode: StatusCodes.Status401Unauthorized } apiException => Problem(
                title: "Strava authorization failed.",
                detail: apiException.Message,
                statusCode: StatusCodes.Status401Unauthorized),
            StravaApiException { StatusCode: StatusCodes.Status429TooManyRequests } apiException => Problem(
                title: "Strava rate limit exceeded.",
                detail: apiException.Message,
                statusCode: StatusCodes.Status429TooManyRequests),
            StravaApiException apiException => Problem(
                title: "Strava API request failed.",
                detail: apiException.Message,
                statusCode: apiException.StatusCode),
            _ => LogAndProblem(exception, logMessage)
        };
    }

    private ObjectResult LogAndProblem(Exception exception, string logMessage)
    {
        logger.LogError(exception, "{Message}", logMessage);
        return Problem(
            title: "Strava integration failed.",
            detail: logMessage,
            statusCode: StatusCodes.Status500InternalServerError);
    }
}
