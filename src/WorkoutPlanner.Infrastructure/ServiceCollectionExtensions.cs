using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using WorkoutPlanner.Domain.Interfaces;
using WorkoutPlanner.Infrastructure.Persistence;

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
}
