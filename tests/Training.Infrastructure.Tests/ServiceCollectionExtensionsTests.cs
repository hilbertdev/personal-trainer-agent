using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Training.Application.Abstractions;
using Training.Infrastructure;
using Training.Infrastructure.Persistence;

namespace Training.Infrastructure.Tests;

public sealed class ServiceCollectionExtensionsTests
{
    [Fact]
    public void AddSqliteTrainingInfrastructure_ThrowsWhenConnectionStringMissing()
    {
        var services = new ServiceCollection();

        var act = () => services.AddSqliteTrainingInfrastructure(" ");

        act.Should().Throw<ArgumentException>()
            .WithParameterName("connectionString");
    }

    [Fact]
    [Trait("Category", TestCategories.Integration)]
    public void AddSqliteTrainingInfrastructure_RegistersExpectedServices()
    {
        var services = new ServiceCollection();
        services.AddSqliteTrainingInfrastructure("Data Source=:memory:");

        using var provider = services.BuildServiceProvider();

        provider.GetRequiredService<IWorkoutRepository>().Should().BeOfType<SqliteWorkoutRepository>();
        provider.GetRequiredService<IWorkoutProgressRepository>().Should().BeOfType<SqliteWorkoutProgressRepository>();
        provider.GetRequiredService<ITrainingProgramRepository>().Should().BeOfType<SqliteTrainingProgramRepository>();
    }
}
