using Microsoft.Extensions.DependencyInjection;
using WorkoutPlanner.Application.Analysis;
using WorkoutPlanner.Application.Scheduling;
using WorkoutPlanner.Application.Services;
using WorkoutPlanner.ConsoleApp;
using WorkoutPlanner.Domain.Interfaces;
using WorkoutPlanner.Infrastructure;
using WorkoutPlanner.Infrastructure.Seeding;

var services = new ServiceCollection();
var connectionString = GetRequiredConnectionString();

services.AddSingleton<FatigueScoreCalculator>();
services.AddSingleton<RecoveryHeuristicAnalyzer>();
services.AddSingleton<IFatigueAnalyzer, FatigueAnalyzer>();
services.AddSingleton<IPhaseScheduler, HypertrophyPhaseScheduler>();
services.AddSingleton<IWorkoutPlanningService, WorkoutPlanningService>();
services.AddWorkoutPlannerInfrastructure(connectionString);

using var serviceProvider = services.BuildServiceProvider();

var planningService = serviceProvider.GetRequiredService<IWorkoutPlanningService>();
var sampleWorkouts = SampleWorkoutDataFactory.Create();
var result = await planningService.BuildPlanAsync(sampleWorkouts);

ConsoleReportWriter.Print(result);

static string GetRequiredConnectionString()
{
    const string primaryEnvironmentVariable = "WORKOUTPLANNER_CONNECTION_STRING";
    const string dotNetEnvironmentVariable = "ConnectionStrings__WorkoutPlanner";

    var connectionString =
        Environment.GetEnvironmentVariable(primaryEnvironmentVariable)
        ?? Environment.GetEnvironmentVariable(dotNetEnvironmentVariable);

    return string.IsNullOrWhiteSpace(connectionString)
        ? throw new InvalidOperationException(
            $"Set {primaryEnvironmentVariable} or {dotNetEnvironmentVariable} to a Postgres connection string.")
        : connectionString;
}
