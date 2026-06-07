using FluentAssertions;
using NSubstitute;
using Training.Application.Abstractions;
using Training.Application.Programs;
using Training.Application.Services;
using Training.Domain.Entities;
using Training.Domain.Enums;
using Training.Domain.ValueObjects;
using Training.Application.Providers;

namespace Training.Application.Tests;

public sealed class TrainingProgramServiceTests
{
    private readonly ITrainingProgramRepository _repository = Substitute.For<ITrainingProgramRepository>();
    private readonly IActivityProvider _activityProvider = Substitute.For<IActivityProvider>();

    [Fact]
    public async Task CreateTrainingProgramAsync_ThrowsWhenEndDateBeforeStartDate()
    {
        var service = CreateService();
        var command = new CreateTrainingProgramCommand(
            "Block 1",
            Guid.NewGuid(),
            new DateOnly(2026, 3, 10),
            new DateOnly(2026, 3, 1));

        var act = () => service.CreateTrainingProgramAsync(command);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*end date*");
    }

    [Fact]
    public async Task AddMesocycleAsync_ThrowsWhenDurationIsZero()
    {
        var programId = Guid.NewGuid();
        var program = new TrainingProgram(programId, "Block 1", Guid.NewGuid(), new DateOnly(2026, 1, 1), null, []);
        _repository.GetProgramAsync(programId, Arg.Any<CancellationToken>()).Returns(program);

        var service = CreateService();
        var command = new AddMesocycleCommand("Meso 1", new DateOnly(2026, 1, 1), 0);

        var act = () => service.AddMesocycleAsync(programId, command);

        await act.Should().ThrowAsync<ArgumentOutOfRangeException>();
    }

    [Fact]
    public async Task RecordWorkoutExecutionAsync_DetectsSubstitutionAndCalculatesVolume()
    {
        var athleteId = Guid.NewGuid();
        var templateId = Guid.NewGuid();
        var exerciseTemplateId = Guid.NewGuid();
        var template = CreateTemplate(templateId, exerciseTemplateId, "Barbell Bench Press");
        _repository.GetWorkoutTemplateAsync(templateId, Arg.Any<CancellationToken>()).Returns(template);
        _repository.UpsertExerciseSubstitutionAsync(Arg.Any<ExerciseSubstitution>(), Arg.Any<CancellationToken>())
            .Returns(callInfo => callInfo.Arg<ExerciseSubstitution>());
        _repository.SaveWorkoutExecutionAsync(Arg.Any<WorkoutExecution>(), Arg.Any<CancellationToken>())
            .Returns(callInfo => callInfo.Arg<WorkoutExecution>());

        var service = CreateService();
        var command = new RecordWorkoutExecutionCommand(
            athleteId,
            new DateOnly(2026, 3, 1),
            [
                new ExerciseExecutionInput(
                    exerciseTemplateId,
                    "Dumbbell Bench Press",
                    3,
                    10,
                    80m,
                    "Equipment unavailable",
                    ["gym"])
            ],
            TimeSpan.FromMinutes(60),
            TotalVolume: null,
            Notes: "Solid session");

        var execution = await service.RecordWorkoutExecutionAsync(templateId, command);

        execution.TotalVolume.Should().Be(2400m);
        await _repository.Received(1).UpsertExerciseSubstitutionAsync(
            Arg.Is<ExerciseSubstitution>(substitution =>
                substitution.OriginalExerciseName == "Barbell Bench Press"
                && substitution.SubstitutedExerciseName == "Dumbbell Bench Press"),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task RecordWorkoutExecutionAsync_ThrowsWhenTemplateNotFound()
    {
        var service = CreateService();
        _repository.GetWorkoutTemplateAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((WorkoutTemplate?)null);

        var act = () => service.RecordWorkoutExecutionAsync(
            Guid.NewGuid(),
            new RecordWorkoutExecutionCommand(
                Guid.NewGuid(),
                new DateOnly(2026, 3, 1),
                [],
                TimeSpan.FromMinutes(30),
                0m,
                null));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }

    [Fact]
    public async Task ImportProgramAsync_OrchestratesNestedCommands()
    {
        var athleteId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        var mesocycleId = Guid.NewGuid();
        var weeklyPlanId = Guid.NewGuid();

        _repository.SaveProgramAsync(Arg.Any<TrainingProgram>(), Arg.Any<CancellationToken>())
            .Returns(callInfo => callInfo.Arg<TrainingProgram>() with { Id = programId });
        _repository.GetProgramAsync(programId, Arg.Any<CancellationToken>())
            .Returns(new TrainingProgram(programId, "Imported Program", athleteId, new DateOnly(2026, 1, 1), null, []));
        _repository.AddMesocycleAsync(programId, Arg.Any<Mesocycle>(), Arg.Any<CancellationToken>())
            .Returns(callInfo => callInfo.Arg<Mesocycle>() with { Id = mesocycleId });
        _repository.AddWeeklyPlanAsync(mesocycleId, Arg.Any<WeeklyPlan>(), Arg.Any<CancellationToken>())
            .Returns(callInfo => callInfo.Arg<WeeklyPlan>() with { Id = weeklyPlanId });
        _repository.AddWorkoutTemplateAsync(weeklyPlanId, Arg.Any<WorkoutTemplate>(), Arg.Any<CancellationToken>())
            .Returns(callInfo => callInfo.Arg<WorkoutTemplate>());

        var service = CreateService();
        var command = new ImportProgramCommand(
            "Imported Program",
            athleteId,
            new DateOnly(2026, 1, 1),
            null,
            [
                new ImportMesocycleCommand(
                    "Meso 1",
                    new DateOnly(2026, 1, 1),
                    4,
                    [
                        new ImportWeeklyPlanCommand(
                            1,
                            [
                                new ImportWorkoutTemplateCommand(
                                    "Upper 1",
                                    DayOfWeek.Monday,
                                    [
                                        new ExerciseTemplateInput(
                                            "Bench Press",
                                            null,
                                            4,
                                            6,
                                            8,
                                            null,
                                            null,
                                            null,
                                            null,
                                            null,
                                            ExerciseCategory.Strength,
                                            null)
                                    ],
                                    "Push",
                                    null)
                            ])
                    ])
            ]);

        var program = await service.ImportProgramAsync(command);

        program.Id.Should().Be(programId);
        await _repository.Received(1).AddMesocycleAsync(programId, Arg.Any<Mesocycle>(), Arg.Any<CancellationToken>());
        await _repository.Received(1).AddWeeklyPlanAsync(mesocycleId, Arg.Any<WeeklyPlan>(), Arg.Any<CancellationToken>());
        await _repository.Received(1).AddWorkoutTemplateAsync(weeklyPlanId, Arg.Any<WorkoutTemplate>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task SyncStravaActivitiesAsync_ThrowsWhenProviderNotConfigured()
    {
        var service = new TrainingProgramService(_repository);

        var act = () => service.SyncStravaActivitiesAsync(
            new SyncStravaActivitiesCommand(Guid.NewGuid(), new DateOnly(2026, 1, 1), new DateOnly(2026, 1, 7)));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*No activity provider*");
    }

    [Fact]
    public async Task SyncStravaActivitiesAsync_ThrowsWhenDateRangeInvalid()
    {
        var service = CreateService(withActivityProvider: true);

        var act = () => service.SyncStravaActivitiesAsync(
            new SyncStravaActivitiesCommand(
                Guid.NewGuid(),
                new DateOnly(2026, 1, 10),
                new DateOnly(2026, 1, 1)));

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*end date*");
    }

    [Fact]
    public async Task SyncStravaActivitiesAsync_ImportsActivitiesAsExecutions()
    {
        var athleteId = Guid.NewGuid();
        var templateId = Guid.NewGuid();
        var activityId = "12345";
        var activityDate = new DateOnly(2026, 2, 1);

        _activityProvider.GetActivitiesAsync(athleteId, activityDate, activityDate, Arg.Any<CancellationToken>())
            .Returns([
                new ProviderActivity(
                    activityId,
                    "Strava",
                    athleteId,
                    new DateTimeOffset(2026, 2, 1, 8, 0, 0, TimeSpan.Zero),
                    TimeSpan.FromMinutes(45),
                    "Run",
                    "Run",
                    10500,
                    150,
                    null,
                    "Morning run")
            ]);
        _repository.GetWorkoutTemplateForDayAsync(athleteId, activityDate, Arg.Any<CancellationToken>())
            .Returns(CreateTemplate(templateId, Guid.NewGuid(), "Run Day"));
        _repository.SaveWorkoutExecutionAsync(Arg.Any<WorkoutExecution>(), Arg.Any<CancellationToken>())
            .Returns(callInfo => callInfo.Arg<WorkoutExecution>());

        var service = CreateService(withActivityProvider: true);
        var executions = await service.SyncStravaActivitiesAsync(
            new SyncStravaActivitiesCommand(athleteId, activityDate, activityDate));

        executions.Should().HaveCount(1);
        executions[0].ProviderName.Should().Be("Strava");
        executions[0].ProviderActivityId.Should().Be(activityId);
        await _repository.Received(1).SaveTrainingLoadSummaryAsync(
            Arg.Is<TrainingLoadSummary>(summary => summary.AthleteId == athleteId && summary.Date == activityDate),
            Arg.Any<CancellationToken>());
    }

    private TrainingProgramService CreateService(bool withActivityProvider = false)
    {
        return withActivityProvider
            ? new TrainingProgramService(_repository, _activityProvider)
            : new TrainingProgramService(_repository);
    }

    private static WorkoutTemplate CreateTemplate(Guid templateId, Guid exerciseTemplateId, string exerciseName)
    {
        return new WorkoutTemplate(
            templateId,
            "Upper 1",
            DayOfWeek.Monday,
            [
                new ExerciseTemplate(
                    exerciseTemplateId,
                    exerciseName,
                    null,
                    4,
                    new RepRange(6, 8),
                    null,
                    null,
                    null,
                    null,
                    null,
                    ExerciseCategory.Strength,
                    [])
            ],
            "Push",
            null);
    }
}
