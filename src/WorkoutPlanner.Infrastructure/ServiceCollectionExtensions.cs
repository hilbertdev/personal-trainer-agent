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
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new ArgumentException("A Postgres connection string is required.", nameof(connectionString));
        }

        services.AddSingleton(_ => NpgsqlDataSource.Create(connectionString));
        services.AddSingleton<IWorkoutRepository, PostgresWorkoutRepository>();

        return services;
    }
}
