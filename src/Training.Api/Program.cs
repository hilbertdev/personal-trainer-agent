using System.Reflection;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http.Json;
using Training.Api.Contracts;
using Training.Application.Abstractions;
using Training.Application.Analysis;
using Training.Application.Commands;
using Training.Application.SampleData;
using Training.Application.Scheduling;
using Training.Application.Services;
using Training.Domain.Entities;

var builder = WebApplication.CreateBuilder(args);
var sqliteConnectionString = builder.Configuration["TRAINING_SQLITE_CONNECTION_STRING"]
    ?? builder.Configuration["WORKOUTPLANNER_SQLITE_CONNECTION_STRING"]
    ?? builder.Configuration.GetConnectionString("TrainingSqlite")
    ?? "Data Source=App_Data/training.db";
var corsPolicyName = "TrainingCors";

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
builder.Services.AddSingleton<IWorkoutAgentQueryService, WorkoutAgentQueryService>();
builder.Services.AddSingleton<IWorkoutProgressService, WorkoutProgressService>();
builder.Services.AddSingleton<IWorkoutRecommendationService, WorkoutRecommendationService>();
builder.Services.AddSingleton<IWorkoutSeedService, WorkoutSeedService>();
RegisterInfrastructure(builder.Services, sqliteConnectionString);

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

workouts.MapGet(
        "/sample",
        (IWorkoutSeedService seedService) => WorkoutResponseMapper.ToWeekResponse(seedService.CreateSampleWeek()))
    .WithName("GetSampleWorkoutData")
    .WithSummary("Returns sample workout data that can be submitted to the analyzer.")
    .Produces<WorkoutWeekResponse>();

workouts.MapPost(
        "/analyze",
        async (
            WorkoutAnalysisRequest request,
            IWorkoutPlanningService workoutPlanningService,
            IWorkoutRecommendationService recommendationService,
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
            var response = ToAnalysisResponse(workoutDays, result, recommendationService);

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
            IWorkoutProgressService progressService,
            CancellationToken cancellationToken) =>
        {
            var command = new RecordCompletedWorkoutCommand(
                request.Id,
                request.WorkoutDate,
                request.WorkoutType,
                request.CompletedAt,
                request.Notes);
            var progress = await progressService.RecordCompletedWorkoutAsync(command, cancellationToken);

            return Results.Created("/api/progress", ToProgressResponse(progress));
        })
    .WithTags("Progress")
    .WithName("RecordCompletedWorkout")
    .WithSummary("Stores a completed workout in the beta SQLite progress database.")
    .RequireCors(corsPolicyName)
    .Produces<WorkoutProgressResponse>(StatusCodes.Status201Created);

app.MapGet(
        "/api/progress",
        async (IWorkoutProgressService progressService, CancellationToken cancellationToken) =>
        {
            var progress = await progressService.GetProgressAsync(cancellationToken);
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
    var seedService = services.GetRequiredService<IWorkoutSeedService>();
    await seedService.SeedSampleWeekAsync();
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
    WorkoutPlanningResult result,
    IWorkoutRecommendationService recommendationService)
{
    return new WorkoutAnalysisBetaResponse(
        WorkoutResponseMapper.ToSummaryResponse(workouts),
        WorkoutResponseMapper.ToAnalysisResponse(result.Analysis),
        result.Plan.ProjectedWeeks
            .Select(WorkoutResponseMapper.ToProjectedWeekResponse)
            .ToList(),
        recommendationService.BuildRecommendations(result),
        result.Analysis.Warnings);
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
