using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Training.Application.Abstractions;
using Training.Infrastructure.Persistence;

namespace Training.Infrastructure;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddTrainingInfrastructure(
        this IServiceCollection services,
        string connectionString)
    {
        return services.AddPostgresTrainingInfrastructure(connectionString);
    }

    public static IServiceCollection AddPostgresTrainingInfrastructure(
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

    public static IServiceCollection AddSqliteTrainingInfrastructure(
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
        services.AddSingleton<ITrainingProgramRepository, SqliteTrainingProgramRepository>();

        return services;
    }
}
