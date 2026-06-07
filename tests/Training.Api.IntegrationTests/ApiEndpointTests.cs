using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Training.Api.Contracts;
using Training.Domain.Enums;

namespace Training.Api.IntegrationTests;

public sealed class HealthEndpointTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public HealthEndpointTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task GetHealth_ReturnsHealthy()
    {
        var response = await _client.GetAsync("/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}

public sealed class TrainingProgramsFlowTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public TrainingProgramsFlowTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task ImportListOverviewAndEndProgram_Succeeds()
    {
        var athleteId = Guid.NewGuid();
        var importRequest = TestRequestFactory.CreateImportProgramRequest(athleteId);

        var importResponse = await _client.PostAsJsonAsync("/api/programs/import", importRequest);
        importResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var imported = await importResponse.Content.ReadIntegrationJsonAsync<TrainingProgramResponse>();
        imported.Should().NotBeNull();

        var listResponse = await _client.GetAsync($"/api/programs?athleteId={athleteId}");
        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var programs = await listResponse.Content.ReadIntegrationJsonAsync<List<ProgramSummaryResponse>>();
        programs.Should().ContainSingle(program => program.Id == imported!.Id);

        var overviewResponse = await _client.GetAsync($"/api/programs/{imported!.Id}/overview");
        overviewResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var endResponse = await _client.PostAsJsonAsync(
            $"/api/programs/{imported.Id}/end",
            new EndProgramRequest(imported.StartDate.AddDays(7)));
        endResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}

public sealed class WorkoutExecutionFlowTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public WorkoutExecutionFlowTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task ImportThenGetTodayAndExecuteWorkout_Succeeds()
    {
        var athleteId = Guid.NewGuid();
        var workoutDate = new DateOnly(2026, 1, 5);
        var importRequest = TestRequestFactory.CreateImportProgramRequest(athleteId, workoutDate);

        var importResponse = await _client.PostAsJsonAsync("/api/programs/import", importRequest);
        var imported = await importResponse.Content.ReadIntegrationJsonAsync<TrainingProgramResponse>();
        imported.Should().NotBeNull();

        var todayResponse = await _client.GetAsync(
            $"/api/workouts/today?athleteId={athleteId}&date={workoutDate:yyyy-MM-dd}");
        todayResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var today = await todayResponse.Content.ReadIntegrationJsonAsync<WorkoutForDayResponse>();
        today.Should().NotBeNull();
        var templateId = today!.WorkoutTemplate.Id;
        var exerciseTemplateId = today.WorkoutTemplate.Exercises[0].Id;

        var executeResponse = await _client.PostAsJsonAsync(
            $"/api/workouts/{templateId}/execute",
            new RecordWorkoutExecutionRequest(
                athleteId,
                workoutDate,
                [
                    new ExerciseExecutionRequest(
                        exerciseTemplateId,
                        "Bench Press",
                        4,
                        8,
                        100m,
                        null,
                        [])
                ],
                60,
                null,
                "Completed"));

        executeResponse.StatusCode.Should().Be(HttpStatusCode.Created);
    }
}

public sealed class WorkoutAnalysisTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public WorkoutAnalysisTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task AnalyzeWorkouts_ReturnsBadRequestForEmptyPayload()
    {
        var response = await _client.PostAsJsonAsync("/api/workouts/analyze", new { workouts = Array.Empty<object>() });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task AnalyzeWorkouts_ReturnsAnalysisForValidWeek()
    {
        var sampleResponse = await _client.GetAsync("/api/workouts/sample");
        sampleResponse.EnsureSuccessStatusCode();
        var sampleWeek = await sampleResponse.Content.ReadIntegrationJsonAsync<WorkoutWeekResponse>();
        sampleWeek.Should().NotBeNull();

        var analyzeResponse = await _client.PostAsJsonAsync(
            "/api/workouts/analyze",
            new { workouts = sampleWeek!.Workouts });

        analyzeResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var analysis = await analyzeResponse.Content.ReadIntegrationJsonAsync<WorkoutAnalysisBetaResponse>();
        analysis.Should().NotBeNull();
        analysis!.FatigueAnalysis.EstimatedFatigue.Should().NotBeNullOrWhiteSpace();
    }
}

public sealed class ProgressTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ProgressTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task RecordAndGetProgress_RoundTrips()
    {
        var recordResponse = await _client.PostAsJsonAsync(
            "/api/progress",
            new
            {
                workoutDate = "2026-04-01",
                workoutType = WorkoutType.Push.ToString(),
                notes = "Done"
            });

        recordResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var getResponse = await _client.GetAsync("/api/progress");
        getResponse.EnsureSuccessStatusCode();
        var progress = await getResponse.Content.ReadIntegrationJsonAsync<WorkoutProgressResponse>();
        progress!.CompletedCount.Should().BeGreaterThan(0);
    }
}

public sealed class AgentEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AgentEndpointsTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task AgentEndpoints_ReturnDataAfterSeed()
    {
        (await _client.GetAsync("/api/agent")).EnsureSuccessStatusCode();

        var currentWeekResponse = await _client.GetAsync("/api/agent/workouts/current-week");
        currentWeekResponse.EnsureSuccessStatusCode();

        var analysisResponse = await _client.GetAsync("/api/agent/workouts/analysis");
        analysisResponse.EnsureSuccessStatusCode();

        var projectionResponse = await _client.GetAsync("/api/agent/workouts/projection");
        projectionResponse.EnsureSuccessStatusCode();
    }
}

public sealed class StravaSyncTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public StravaSyncTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task SyncWithoutProvider_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/strava/sync",
            new SyncStravaActivitiesRequest(
                Guid.NewGuid(),
                new DateOnly(2026, 1, 1),
                new DateOnly(2026, 1, 7)));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
