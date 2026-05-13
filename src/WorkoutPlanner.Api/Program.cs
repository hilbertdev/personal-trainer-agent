using System.Text.Json.Serialization;
using WorkoutPlanner.Application.Analysis;
using WorkoutPlanner.Application.Scheduling;
using WorkoutPlanner.Application.Services;
using WorkoutPlanner.Domain.Interfaces;
using WorkoutPlanner.Infrastructure.Persistence;
using WorkoutPlanner.Infrastructure.Seeding;

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddSingleton<IWorkoutRepository, InMemoryWorkoutRepository>();
builder.Services.AddSingleton<IWorkoutPlanningService, WorkoutPlanningService>();

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
