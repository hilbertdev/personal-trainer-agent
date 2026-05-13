using System.Text.Json.Serialization;
using WorkoutPlanner.Application.Analysis;
using WorkoutPlanner.Application.Scheduling;
using WorkoutPlanner.Application.Services;
using WorkoutPlanner.Domain.Interfaces;
using WorkoutPlanner.Infrastructure;
using WorkoutPlanner.Infrastructure.Seeding;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("WorkoutPlanner")
    ?? builder.Configuration["WORKOUTPLANNER_CONNECTION_STRING"]
    ?? throw new InvalidOperationException(
        "Set ConnectionStrings:WorkoutPlanner or WORKOUTPLANNER_CONNECTION_STRING to a Postgres connection string.");

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddSingleton<FatigueScoreCalculator>();
builder.Services.AddSingleton<RecoveryHeuristicAnalyzer>();
builder.Services.AddSingleton<IFatigueAnalyzer, FatigueAnalyzer>();
builder.Services.AddSingleton<IPhaseScheduler, HypertrophyPhaseScheduler>();
builder.Services.AddSingleton<IWorkoutPlanningService, WorkoutPlanningService>();
builder.Services.AddWorkoutPlannerInfrastructure(connectionString);

var app = builder.Build();

await SeedSampleWorkoutDataAsync(app.Services);

app.MapControllers();

await app.RunAsync();

static async Task SeedSampleWorkoutDataAsync(IServiceProvider services)
{
    var repository = services.GetRequiredService<IWorkoutRepository>();
    var currentWeek = await repository.GetCurrentWeekAsync();

    if (currentWeek.Count is 0)
    {
        await repository.SaveWeeklyPlanAsync(SampleWorkoutDataFactory.Create());
    }
}
