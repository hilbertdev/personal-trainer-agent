using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http.Json;
using WorkoutPlanner.Api.Contracts;
using WorkoutPlanner.Application.Analysis;
using WorkoutPlanner.Application.Scheduling;
using WorkoutPlanner.Application.Services;
using WorkoutPlanner.Domain.Entities;
using WorkoutPlanner.Domain.Interfaces;
using WorkoutPlanner.Infrastructure;
using WorkoutPlanner.Infrastructure.Seeding;

var builder = WebApplication.CreateBuilder(args);
var sqliteConnectionString = builder.Configuration["WORKOUTPLANNER_SQLITE_CONNECTION_STRING"]
    ?? builder.Configuration.GetConnectionString("WorkoutPlannerSqlite")
    ?? "Data Source=App_Data/workoutplanner.db";
var corsPolicyName = "WorkoutPlannerCors";

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.Configure<JsonOptions>(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        corsPolicyName,
        policy =>
        {
            var allowedOrigins = GetAllowedOrigins(builder.Configuration);

            if (allowedOrigins.Length is 0)
            {
                policy.AllowAnyOrigin();
            }
            else
            {
                policy.WithOrigins(allowedOrigins);
            }

            policy.AllowAnyHeader().AllowAnyMethod();
        });
});
builder.Services.AddHealthChecks();

builder.Services.AddSingleton<FatigueScoreCalculator>();
builder.Services.AddSingleton<RecoveryHeuristicAnalyzer>();
builder.Services.AddSingleton<IFatigueAnalyzer, FatigueAnalyzer>();
builder.Services.AddSingleton<IPhaseScheduler, HypertrophyPhaseScheduler>();
builder.Services.AddSingleton<IWorkoutPlanningService, WorkoutPlanningService>();
builder.Services.AddSqliteWorkoutPlannerInfrastructure(sqliteConnectionString);

var app = builder.Build();

await SeedSampleWorkoutDataAsync(app.Services);

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors(corsPolicyName);

app.MapHealthChecks("/health");
app.MapControllers();

var workouts = app.MapGroup("/api/workouts")
    .WithTags("Workouts")
    .RequireCors(corsPolicyName);

workouts.MapGet("/sample", () => WorkoutResponseMapper.ToWeekResponse(SampleWorkoutDataFactory.Create()))
    .WithName("GetSampleWorkoutData")
    .WithSummary("Returns sample workout data that can be submitted to the analyzer.")
    .Produces<WorkoutWeekResponse>();

workouts.MapPost(
        "/analyze",
        async (
            WorkoutAnalysisRequest request,
            IWorkoutPlanningService workoutPlanningService,
            CancellationToken cancellationToken) =>
        {
            if (request.Workouts.Count is 0)
            {
                return Results.BadRequest(new
                {
                    error = "At least one workout day is required."
                });
            }

            var workoutDays = request.Workouts
                .Select(ToWorkoutDay)
                .OrderBy(workout => workout.Date)
                .ToList();
            var result = await workoutPlanningService.BuildPlanAsync(workoutDays, cancellationToken);
            var response = ToAnalysisResponse(workoutDays, result);

            return Results.Ok(response);
        })
    .WithName("AnalyzeWorkouts")
    .WithSummary("Analyzes weekly workouts and returns fatigue, projected hypertrophy plan, and recommendations.")
    .Produces<WorkoutAnalysisBetaResponse>()
    .Produces(StatusCodes.Status400BadRequest);

app.MapPost(
        "/api/progress",
        async (
            CompletedWorkoutRequest request,
            IWorkoutProgressRepository progressRepository,
            CancellationToken cancellationToken) =>
        {
            var completedWorkout = new CompletedWorkout(
                request.Id ?? Guid.NewGuid(),
                request.WorkoutDate,
                request.WorkoutType,
                request.CompletedAt ?? DateTimeOffset.UtcNow,
                request.Notes);
            await progressRepository.SaveCompletedWorkoutAsync(completedWorkout, cancellationToken);
            var progress = await progressRepository.GetProgressAsync(cancellationToken);

            return Results.Created("/api/progress", ToProgressResponse(progress));
        })
    .WithTags("Progress")
    .WithName("RecordCompletedWorkout")
    .WithSummary("Stores a completed workout in the beta SQLite progress database.")
    .RequireCors(corsPolicyName)
    .Produces<WorkoutProgressResponse>(StatusCodes.Status201Created);

app.MapGet(
        "/api/progress",
        async (IWorkoutProgressRepository progressRepository, CancellationToken cancellationToken) =>
        {
            var progress = await progressRepository.GetProgressAsync(cancellationToken);
            return ToProgressResponse(progress);
        })
    .WithTags("Progress")
    .WithName("GetWorkoutProgress")
    .WithSummary("Returns stored completed workouts for the beta dashboard.")
    .RequireCors(corsPolicyName)
    .Produces<WorkoutProgressResponse>();

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

static string[] GetAllowedOrigins(IConfiguration configuration)
{
    var configuredOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
        ?? [];
    var envOrigins = configuration["CORS_ALLOWED_ORIGINS"]?
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        ?? [];

    return configuredOrigins.Concat(envOrigins).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
}

static WorkoutDay ToWorkoutDay(WorkoutDayRequest request)
{
    return new WorkoutDay(
        request.Date,
        request.WorkoutType,
        request.Exercises.Select(ToExercise).ToList(),
        request.DurationMinutes,
        request.Intensity,
        request.Notes);
}

static Exercise ToExercise(ExerciseRequest request)
{
    return new Exercise(
        request.Name,
        request.Sets,
        request.Reps,
        request.RirOrRpe,
        request.MuscleGroups);
}

static WorkoutAnalysisBetaResponse ToAnalysisResponse(
    IReadOnlyList<WorkoutDay> workouts,
    WorkoutPlanningResult result)
{
    var recommendations = BuildRecommendations(result);

    return new WorkoutAnalysisBetaResponse(
        WorkoutResponseMapper.ToSummaryResponse(workouts),
        WorkoutResponseMapper.ToAnalysisResponse(result.Analysis),
        result.Plan.ProjectedWeeks
            .Select(WorkoutResponseMapper.ToProjectedWeekResponse)
            .ToList(),
        recommendations,
        result.Analysis.Warnings);
}

static IReadOnlyList<string> BuildRecommendations(WorkoutPlanningResult result)
{
    var recommendations = new List<string>
    {
        result.Analysis.EstimatedFatigue switch
        {
            "HIGH" => "Prioritize sleep, hydration, and at least one lower-intensity session this week.",
            "MODERATE" => "Keep progressing, but avoid stacking high-intensity sessions without recovery.",
            _ => "Fatigue is manageable; continue the planned hypertrophy progression."
        }
    };

    if (result.Plan.RecommendedRestDays.Count > 0)
    {
        var days = string.Join(", ", result.Plan.RecommendedRestDays.Select(day => day.ToString("yyyy-MM-dd")));
        recommendations.Add($"Recommended rest days: {days}.");
    }

    return recommendations;
}

static WorkoutProgressResponse ToProgressResponse(WorkoutProgress progress)
{
    return new WorkoutProgressResponse(
        progress.CompletedCount,
        progress.LastCompletedWorkoutDate,
        progress.CompletedWorkouts.Select(ToCompletedWorkoutResponse).ToList());
}

static CompletedWorkoutResponse ToCompletedWorkoutResponse(CompletedWorkout completedWorkout)
{
    return new CompletedWorkoutResponse(
        completedWorkout.Id,
        completedWorkout.WorkoutDate,
        completedWorkout.WorkoutType,
        completedWorkout.CompletedAt,
        completedWorkout.Notes);
}
