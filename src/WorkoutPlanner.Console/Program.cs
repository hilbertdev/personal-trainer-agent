using Microsoft.Extensions.DependencyInjection;
using WorkoutPlanner.Application.Analysis;
using WorkoutPlanner.Application.Scheduling;
using WorkoutPlanner.Application.Services;
using WorkoutPlanner.ConsoleApp;
using WorkoutPlanner.Domain.Interfaces;
using WorkoutPlanner.Infrastructure;
using WorkoutPlanner.Infrastructure.Seeding;

var services = new ServiceCollection();
var connectionString = GetSqliteConnectionString();

services.AddSingleton<FatigueScoreCalculator>();
services.AddSingleton<RecoveryHeuristicAnalyzer>();
services.AddSingleton<IFatigueAnalyzer, FatigueAnalyzer>();
services.AddSingleton<IPhaseScheduler, HypertrophyPhaseScheduler>();
services.AddSingleton<IWorkoutPlanningService, WorkoutPlanningService>();
services.AddSqliteWorkoutPlannerInfrastructure(connectionString);

using var serviceProvider = services.BuildServiceProvider();

var planningService = serviceProvider.GetRequiredService<IWorkoutPlanningService>();
var sampleWorkouts = SampleWorkoutDataFactory.Create();
var result = await planningService.BuildPlanAsync(sampleWorkouts);

ConsoleReportWriter.Print(result);

static string GetSqliteConnectionString()
{
    const string primaryEnvironmentVariable = "WORKOUTPLANNER_SQLITE_CONNECTION_STRING";
    const string dotNetEnvironmentVariable = "ConnectionStrings__WorkoutPlannerSqlite";

    return Environment.GetEnvironmentVariable(primaryEnvironmentVariable)
        ?? Environment.GetEnvironmentVariable(dotNetEnvironmentVariable)
        ?? "Data Source=App_Data/workoutplanner.db";
}
