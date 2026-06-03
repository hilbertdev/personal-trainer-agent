using System.Net.Http.Headers;
using Microsoft.Extensions.DependencyInjection;
using Training.Application.Abstractions;

namespace Training.Strava;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddStravaTrainingIntegration(
        this IServiceCollection services,
        string baseAddress,
        string accessToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(baseAddress);
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);

        services.AddSingleton<IActivityProvider>(_ =>
        {
            var httpClient = new HttpClient
            {
                BaseAddress = new Uri(baseAddress, UriKind.Absolute)
            };
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            return new StravaActivityProvider(new StravaClient(httpClient));
        });

        services.AddSingleton<IAthleteProvider>(_ =>
        {
            var httpClient = new HttpClient
            {
                BaseAddress = new Uri(baseAddress, UriKind.Absolute)
            };
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            return new StravaAthleteProvider(new StravaClient(httpClient));
        });

        return services;
    }
}
