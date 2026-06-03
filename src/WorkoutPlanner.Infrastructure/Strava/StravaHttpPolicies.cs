using System.Net;
using Polly;
using Polly.Extensions.Http;

namespace WorkoutPlanner.Infrastructure.Strava;

internal static class StravaHttpPolicies
{
    public static IAsyncPolicy<HttpResponseMessage> CreateRetryPolicy()
    {
        return HttpPolicyExtensions
            .HandleTransientHttpError()
            .OrResult(response => response.StatusCode is HttpStatusCode.TooManyRequests)
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: retryAttempt => TimeSpan.FromMilliseconds(200 * Math.Pow(2, retryAttempt - 1)));
    }
}
