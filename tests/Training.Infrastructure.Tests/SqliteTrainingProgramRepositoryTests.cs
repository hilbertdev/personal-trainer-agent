using FluentAssertions;
using Training.Domain.Entities;
using Training.Domain.Enums;
using Training.Domain.ValueObjects;
using Training.Infrastructure.Persistence;

namespace Training.Infrastructure.Tests;

public sealed class SqliteTrainingProgramRepositoryTests
{
    [Fact]
    [Trait("Category", TestCategories.Integration)]
    public async Task SaveProgramAsync_RoundTripsProgramGraph()
    {
        using var fixture = new SqliteTestFixture();
        var repository = new SqliteTrainingProgramRepository(fixture.ConnectionFactory);
        var athleteId = Guid.NewGuid();
        var program = await repository.SaveProgramAsync(new TrainingProgram(
            Guid.NewGuid(),
            "Hypertrophy Block",
            athleteId,
            new DateOnly(2026, 1, 1),
            null,
            []));
        var mesocycle = await repository.AddMesocycleAsync(
            program.Id,
            new Mesocycle(Guid.NewGuid(), "Meso 1", new DateOnly(2026, 1, 1), 4, []));
        var weeklyPlan = await repository.AddWeeklyPlanAsync(
            mesocycle.Id,
            new WeeklyPlan(Guid.NewGuid(), 1, [], [], [], []));
        var template = await repository.AddWorkoutTemplateAsync(
            weeklyPlan.Id,
            CreateTemplate("Upper 1", DayOfWeek.Monday));

        var loadedProgram = await repository.GetProgramAsync(program.Id);
        var listedPrograms = await repository.ListProgramsAsync(athleteId);
        var loadedTemplate = await repository.GetWorkoutTemplateAsync(template.Id);

        loadedProgram.Should().NotBeNull();
        loadedProgram!.Name.Should().Be("Hypertrophy Block");
        listedPrograms.Should().ContainSingle(item => item.Id == program.Id);
        loadedTemplate!.Exercises.Should().ContainSingle(exercise => exercise.ExerciseName == "Bench Press");

        var overview = await repository.GetProgramOverviewAsync(program.Id);
        overview.Should().NotBeNull();
        overview!.Program.Id.Should().Be(program.Id);
    }

    [Fact]
    [Trait("Category", TestCategories.Integration)]
    public async Task GetWorkoutTemplateForDayAsync_ReturnsTemplateForMatchingDay()
    {
        using var fixture = new SqliteTestFixture();
        var repository = new SqliteTrainingProgramRepository(fixture.ConnectionFactory);
        var athleteId = Guid.NewGuid();
        var programStart = new DateOnly(2026, 1, 5);
        var workoutDate = new DateOnly(2026, 1, 5);
        var program = await repository.SaveProgramAsync(new TrainingProgram(
            Guid.NewGuid(),
            "Program",
            athleteId,
            programStart,
            null,
            []));
        var mesocycle = await repository.AddMesocycleAsync(
            program.Id,
            new Mesocycle(Guid.NewGuid(), "Meso", programStart, 4, []));
        var weeklyPlan = await repository.AddWeeklyPlanAsync(
            mesocycle.Id,
            new WeeklyPlan(Guid.NewGuid(), 1, [], [], [], []));
        await repository.AddWorkoutTemplateAsync(
            weeklyPlan.Id,
            CreateTemplate("Monday Workout", DayOfWeek.Monday));

        var template = await repository.GetWorkoutTemplateForDayAsync(athleteId, workoutDate);

        template.Should().NotBeNull();
        template!.Name.Should().Be("Monday Workout");
    }

    [Fact]
    [Trait("Category", TestCategories.Integration)]
    public async Task UpsertExerciseSubstitutionAsync_DeduplicatesMatchingSubstitution()
    {
        using var fixture = new SqliteTestFixture();
        var repository = new SqliteTrainingProgramRepository(fixture.ConnectionFactory);
        var athleteId = Guid.NewGuid();
        var exerciseTemplateId = Guid.NewGuid();
        var first = new ExerciseSubstitution(
            Guid.NewGuid(),
            athleteId,
            exerciseTemplateId,
            "Bench Press",
            "Dumbbell Bench Press",
            "Equipment busy",
            ["gym"],
            true,
            1);
        var second = first with { Id = Guid.NewGuid(), Reason = "Still busy", FrequencyUsed = 1 };

        var savedFirst = await repository.UpsertExerciseSubstitutionAsync(first);
        var savedSecond = await repository.UpsertExerciseSubstitutionAsync(second);

        savedSecond.Id.Should().Be(savedFirst.Id);
        savedSecond.FrequencyUsed.Should().Be(2);
        savedSecond.Reason.Should().Be("Still busy");
    }

    [Fact]
    [Trait("Category", TestCategories.Integration)]
    public async Task SaveWorkoutExecutionAsync_UpsertsByProviderActivityId()
    {
        using var fixture = new SqliteTestFixture();
        var repository = new SqliteTrainingProgramRepository(fixture.ConnectionFactory);
        var athleteId = Guid.NewGuid();
        var providerActivityId = "strava-123";
        var first = CreateExecution(athleteId, providerActivityId, 100m);
        var second = CreateExecution(athleteId, providerActivityId, 150m);

        await repository.SaveWorkoutExecutionAsync(first);
        var updated = await repository.SaveWorkoutExecutionAsync(second);

        updated.TotalVolume.Should().Be(150m);
    }

    private static WorkoutTemplate CreateTemplate(string name, DayOfWeek dayOfWeek)
    {
        return new WorkoutTemplate(
            Guid.NewGuid(),
            name,
            dayOfWeek,
            [
                new ExerciseTemplate(
                    Guid.NewGuid(),
                    "Bench Press",
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

    private static WorkoutExecution CreateExecution(Guid athleteId, string providerActivityId, decimal volume)
    {
        return new WorkoutExecution(
            Guid.NewGuid(),
            athleteId,
            new DateOnly(2026, 2, 1),
            null,
            [],
            WorkoutExecutionSource.Imported,
            TimeSpan.FromMinutes(45),
            volume,
            "Imported run",
            "Strava",
            providerActivityId);
    }
}
