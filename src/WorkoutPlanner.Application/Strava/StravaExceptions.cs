namespace WorkoutPlanner.Application.Strava;

public class StravaIntegrationException(string message, Exception? innerException = null)
    : Exception(message, innerException);

public sealed class StravaConnectionNotFoundException(long athleteId)
    : StravaIntegrationException($"No Strava connection was found for athlete {athleteId}.");

public sealed class StravaNoConnectionException()
    : StravaIntegrationException("No Strava connection is available.");

public sealed class StravaMissingScopeException(string scope)
    : StravaIntegrationException($"The Strava connection is missing required scope '{scope}'.");

public sealed class StravaApiException(string message, int statusCode, Exception? innerException = null)
    : StravaIntegrationException(message, innerException)
{
    public int StatusCode { get; } = statusCode;
}
