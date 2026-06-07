using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace Training.Api.IntegrationTests;

public sealed class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        var databasePath = Path.Combine(Path.GetTempPath(), $"training-api-tests-{Guid.NewGuid():N}.db");
        var sqliteConnectionString = $"Data Source={databasePath}";

        Environment.SetEnvironmentVariable("TRAINING_SQLITE_CONNECTION_STRING", sqliteConnectionString);
        Environment.SetEnvironmentVariable("STRAVA_ACCESS_TOKEN", string.Empty);

        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, configurationBuilder) =>
        {
            configurationBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["TRAINING_SQLITE_CONNECTION_STRING"] = sqliteConnectionString,
                ["STRAVA_ACCESS_TOKEN"] = string.Empty
            });
        });
    }
}
