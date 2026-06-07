using FluentAssertions;
using Training.Application.Analysis;
using Training.Application.SampleData;
using Training.Application.Scheduling;
using Training.Domain.Entities;

namespace Training.Application.Tests;

public sealed class HypertrophyPhaseSchedulerTests
{
    private readonly HypertrophyPhaseScheduler _scheduler = new();

    [Fact]
    public async Task ProjectAsync_ReturnsEmptyPlanWhenSeedWeekEmpty()
    {
        var analysis = new FatigueAnalysisResult(50, "LOW", [], []);

        var plan = await _scheduler.ProjectAsync([], analysis);

        plan.Workouts.Should().BeEmpty();
        plan.ProjectedWeeks.Should().BeEmpty();
    }

    [Fact]
    public async Task ProjectAsync_ProjectsFourWeeks()
    {
        var seedWeek = SampleWorkoutDataFactory.Create();
        var analysis = new FatigueAnalysisResult(150, "HIGH", [], []);

        var plan = await _scheduler.ProjectAsync(seedWeek, analysis);

        plan.ProjectedWeeks.Should().HaveCount(4);
        plan.ProjectedWeeks.Should().OnlyContain(week => week.Workouts.Count == 7);
    }

    [Fact]
    public async Task ProjectAsync_ReducesFrequencyWhenFatigueAtOrAbove220()
    {
        var seedWeek = SampleWorkoutDataFactory.Create();
        var highFatigueAnalysis = new FatigueAnalysisResult(220, "HIGH", [], []);
        var moderateFatigueAnalysis = new FatigueAnalysisResult(150, "HIGH", [], []);

        var highFatiguePlan = await _scheduler.ProjectAsync(seedWeek, highFatigueAnalysis);
        var moderateFatiguePlan = await _scheduler.ProjectAsync(seedWeek, moderateFatigueAnalysis);

        CountTrainingDays(highFatiguePlan.ProjectedWeeks[0].Workouts)
            .Should().BeLessThan(CountTrainingDays(moderateFatiguePlan.ProjectedWeeks[0].Workouts));
    }

    [Fact]
    public async Task ProjectAsync_InsertsRestAfterThreeConsecutiveHighIntensityTemplates()
    {
        var start = new DateOnly(2026, 3, 1);
        var seedWeek = Enumerable.Range(0, 3)
            .Select(offset => SampleWorkoutDataFactory.Create()[0] with { Date = start.AddDays(offset) })
            .ToList();
        var analysis = new FatigueAnalysisResult(120, "MODERATE", [], []);

        var plan = await _scheduler.ProjectAsync(seedWeek, analysis);
        var firstWeek = plan.ProjectedWeeks[0].Workouts;

        firstWeek.Should().Contain(workout => workout.IsRestDay);
    }

    [Fact]
    public async Task ProjectAsync_AugmentsProjectedWorkoutNotesWithWeekNumber()
    {
        var seedWeek = SampleWorkoutDataFactory.Create().Take(1).ToList();
        var analysis = new FatigueAnalysisResult(80, "MODERATE", [], []);

        var plan = await _scheduler.ProjectAsync(seedWeek, analysis);
        var projectedWorkout = plan.ProjectedWeeks[0].Workouts.First(workout => !workout.IsRestDay);

        projectedWorkout.Notes.Should().Contain("Projected week 1");
    }

    private static int CountTrainingDays(IReadOnlyList<WorkoutDay> workouts)
    {
        return workouts.Count(workout => !workout.IsRestDay);
    }
}
