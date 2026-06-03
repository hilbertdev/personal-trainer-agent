using System.Reflection;
using Microsoft.Extensions.DependencyInjection;
using Training.Application.Abstractions;
using Training.Application.Analysis;
using Training.Application.Scheduling;
using Training.Application.Services;
using Training.ConsoleApp;

var services = new ServiceCollection();
var connectionString = GetSqliteConnectionString();

services.AddSingleton<FatigueScoreCalculator>();
services.AddSingleton<RecoveryHeuristicAnalyzer>();
services.AddSingleton<IFatigueAnalyzer, FatigueAnalyzer>();
services.AddSingleton<IPhaseScheduler, HypertrophyPhaseScheduler>();
services.AddSingleton<IWorkoutPlanningService, WorkoutPlanningService>();
services.AddSingleton<IWorkoutSeedService, WorkoutSeedService>();
RegisterInfrastructure(services, connectionString);

using var serviceProvider = services.BuildServiceProvider();

var planningService = serviceProvider.GetRequiredService<IWorkoutPlanningService>();
var seedService = serviceProvider.GetRequiredService<IWorkoutSeedService>();
var sampleWorkouts = seedService.CreateSampleWeek();
var result = await planningService.BuildPlanAsync(sampleWorkouts);

ConsoleReportWriter.Print(result);

static string GetSqliteConnectionString()
{
    const string primaryEnvironmentVariable = "TRAINING_SQLITE_CONNECTION_STRING";
    const string legacyEnvironmentVariable = "WORKOUTPLANNER_SQLITE_CONNECTION_STRING";
    const string dotNetEnvironmentVariable = "ConnectionStrings__TrainingSqlite";

    return Environment.GetEnvironmentVariable(primaryEnvironmentVariable)
        ?? Environment.GetEnvironmentVariable(legacyEnvironmentVariable)
        ?? Environment.GetEnvironmentVariable(dotNetEnvironmentVariable)
        ?? "Data Source=App_Data/training.db";
}

static void RegisterInfrastructure(IServiceCollection services, string sqliteConnectionString)
{
    var infrastructureAssembly = LoadAssembly("Training.Infrastructure");
    var extensions = infrastructureAssembly.GetType("Training.Infrastructure.ServiceCollectionExtensions")
        ?? throw new InvalidOperationException("Training.Infrastructure service registration type was not found.");
    var registerMethod = extensions.GetMethod(
        "AddSqliteTrainingInfrastructure",
        BindingFlags.Public | BindingFlags.Static,
        [typeof(IServiceCollection), typeof(string)])
        ?? throw new InvalidOperationException("Training.Infrastructure SQLite registration method was not found.");

    registerMethod.Invoke(null, [services, sqliteConnectionString]);
}

static Assembly LoadAssembly(string assemblyName)
{
    try
    {
        return Assembly.Load(assemblyName);
    }
    catch
    {
        var assemblyPath = Path.Combine(AppContext.BaseDirectory, $"{assemblyName}.dll");

        if (!File.Exists(assemblyPath))
        {
            throw new FileNotFoundException(
                $"Required module '{assemblyName}' was not found in the application output.",
                assemblyPath);
        }

        return Assembly.LoadFrom(assemblyPath);
    }
}
