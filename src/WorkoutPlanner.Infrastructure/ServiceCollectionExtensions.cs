using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using WorkoutPlanner.Application.Strava;
using WorkoutPlanner.Domain.Interfaces;
using WorkoutPlanner.Infrastructure.Persistence;
using WorkoutPlanner.Infrastructure.Strava;

namespace WorkoutPlanner.Infrastructure;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddWorkoutPlannerInfrastructure(
        this IServiceCollection services,
        string connectionString)
    {
        return services.AddPostgresWorkoutPlannerInfrastructure(connectionString);
    }

    public static IServiceCollection AddPostgresWorkoutPlannerInfrastructure(
        this IServiceCollection services,
        string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new ArgumentException("A Postgres connection string is required.", nameof(connectionString));
        }

        services.AddSingleton(_ => NpgsqlDataSource.Create(connectionString));
        services.AddSingleton<IWorkoutRepository, PostgresWorkoutRepository>();

        return services;
    }

    public static IServiceCollection AddSqliteWorkoutPlannerInfrastructure(
        this IServiceCollection services,
        string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new ArgumentException("A SQLite connection string is required.", nameof(connectionString));
        }

        services.AddSingleton(new SqliteConnectionFactory(connectionString));
        services.AddSingleton<IWorkoutRepository, SqliteWorkoutRepository>();
        services.AddSingleton<IWorkoutProgressRepository, SqliteWorkoutProgressRepository>();

        return services;
    }

    public static IServiceCollection AddStravaIntegration(
        this IServiceCollection services,
        IConfiguration configuration,
        string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new ArgumentException("A SQLite connection string is required for Strava persistence.", nameof(connectionString));
        }

        EnsureSqliteDatabaseDirectoryExists(connectionString);

        services.Configure<StravaOptions>(configuration.GetSection(StravaOptions.SectionName));
        services.AddSingleton(TimeProvider.System);
        services.AddDbContext<StravaDbContext>(options => options.UseSqlite(connectionString));
        services.AddScoped<IStravaConnectionRepository, EfCoreStravaConnectionRepository>();
        services.AddScoped<IStravaMetricsService, StravaMetricsService>();

        services.AddHttpClient<IStravaOAuthService, StravaOAuthService>()
            .AddPolicyHandler(StravaHttpPolicies.CreateRetryPolicy());
        services.AddHttpClient<IStravaTokenService, StravaTokenService>()
            .AddPolicyHandler(StravaHttpPolicies.CreateRetryPolicy());
        services.AddHttpClient<IStravaClient, StravaClient>(client =>
            {
                client.BaseAddress = new Uri("https://www.strava.com/api/v3/");
            })
            .AddPolicyHandler(StravaHttpPolicies.CreateRetryPolicy());

        return services;
    }

    private static void EnsureSqliteDatabaseDirectoryExists(string connectionString)
    {
        var builder = new SqliteConnectionStringBuilder(connectionString);
        var dataSource = builder.DataSource;

        if (string.IsNullOrWhiteSpace(dataSource)
            || dataSource is ":memory:"
            || dataSource.StartsWith("file:", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var directory = Path.GetDirectoryName(Path.GetFullPath(dataSource));

        if (!string.IsNullOrWhiteSpace(directory))
        {
            Directory.CreateDirectory(directory);
        }
    }
}
