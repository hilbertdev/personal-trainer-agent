using WorkoutPlanner.Domain.Entities;
using WorkoutPlanner.Domain.Enums;
using WorkoutPlanner.Domain.Interfaces;

namespace WorkoutPlanner.Application.Scheduling;

public sealed class HypertrophyPhaseScheduler : IPhaseScheduler
{
    private const int PhaseLengthWeeks = 4;
    private const int DaysPerWeek = 7;
    private const int FrequencyReductionFatigueThreshold = 220;

    public Task<WeeklyPlan> ProjectAsync(
        IReadOnlyList<WorkoutDay> seedWeek,
        FatigueAnalysisResult analysis,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var orderedSeedWeek = seedWeek.OrderBy(workout => workout.Date).ToList();

        if (orderedSeedWeek.Count is 0)
        {
            var emptyPlan = new WeeklyPlan([], analysis.RecommendedRestDays, []);
            return Task.FromResult(emptyPlan);
        }

        var trainingTemplates = orderedSeedWeek
            .Where(workout => !workout.IsRestDay)
            .ToList();

        var projectedWeeks = new List<ProjectedWeek>();
        var targetTrainingDays = DetermineTargetTrainingDays(trainingTemplates.Count, analysis);
        var seedWeekStart = orderedSeedWeek[0].Date;

        for (var weekNumber = 1; weekNumber <= PhaseLengthWeeks; weekNumber++)
        {
            var weekStart = seedWeekStart.AddDays((weekNumber - 1) * DaysPerWeek);
            var projectedWorkouts = BuildProjectedWeek(
                weekNumber,
                weekStart,
                trainingTemplates,
                targetTrainingDays);

            projectedWeeks.Add(new ProjectedWeek(weekNumber, projectedWorkouts));
        }

        var weeklyPlan = new WeeklyPlan(
            orderedSeedWeek,
            analysis.RecommendedRestDays,
            projectedWeeks);

        return Task.FromResult(weeklyPlan);
    }

    private static IReadOnlyList<WorkoutDay> BuildProjectedWeek(
        int weekNumber,
        DateOnly weekStart,
        IReadOnlyList<WorkoutDay> trainingTemplates,
        int targetTrainingDays)
    {
        if (trainingTemplates.Count is 0 || targetTrainingDays is 0)
        {
            return Enumerable
                .Range(0, DaysPerWeek)
                .Select(dayOffset => CreateRestDay(weekStart.AddDays(dayOffset), "No training sessions were provided."))
                .ToList();
        }

        var projectedWorkouts = new List<WorkoutDay>();
        var templateIndex = 0;
        var plannedTrainingDays = 0;
        var consecutiveTrainingDays = 0;
        var consecutiveHighIntensityDays = 0;
        DateOnly? lastLegTrainingDate = null;

        for (var dayOffset = 0; dayOffset < DaysPerWeek; dayOffset++)
        {
            var date = weekStart.AddDays(dayOffset);
            var nextTemplate = trainingTemplates[templateIndex % trainingTemplates.Count];
            var remainingDays = DaysPerWeek - dayOffset;
            var remainingTrainingNeeded = targetTrainingDays - plannedTrainingDays;
            var mustTrainToHitFrequency = remainingTrainingNeeded >= remainingDays;
            var shouldRest = remainingTrainingNeeded <= 0
                || (!mustTrainToHitFrequency && ShouldInsertRestDay(
                    date,
                    nextTemplate,
                    consecutiveTrainingDays,
                    consecutiveHighIntensityDays,
                    lastLegTrainingDate));

            if (shouldRest)
            {
                projectedWorkouts.Add(CreateRestDay(date, "Projected recovery day to manage fatigue."));
                consecutiveTrainingDays = 0;
                consecutiveHighIntensityDays = 0;
                continue;
            }

            var projectedWorkout = ProjectWorkout(nextTemplate, date, weekNumber);
            projectedWorkouts.Add(projectedWorkout);

            templateIndex++;
            plannedTrainingDays++;
            consecutiveTrainingDays++;
            consecutiveHighIntensityDays = projectedWorkout.Intensity is IntensityLevel.High
                ? consecutiveHighIntensityDays + 1
                : 0;

            if (projectedWorkout.TrainsLegs)
            {
                lastLegTrainingDate = projectedWorkout.Date;
            }
        }

        return projectedWorkouts;
    }

    private static bool ShouldInsertRestDay(
        DateOnly date,
        WorkoutDay nextTemplate,
        int consecutiveTrainingDays,
        int consecutiveHighIntensityDays,
        DateOnly? lastLegTrainingDate)
    {
        if (consecutiveTrainingDays >= 3)
        {
            return true;
        }

        if (consecutiveHighIntensityDays >= 3)
        {
            return true;
        }

        if (nextTemplate.TrainsLegs && lastLegTrainingDate is not null)
        {
            var hoursSinceLastLegSession = (date.DayNumber - lastLegTrainingDate.Value.DayNumber) * 24;
            var requiredLegRecoveryHours = nextTemplate.Intensity is IntensityLevel.High ? 96 : 72;

            if (hoursSinceLastLegSession < requiredLegRecoveryHours)
            {
                return true;
            }
        }

        return false;
    }

    private static int DetermineTargetTrainingDays(
        int availableTrainingTemplates,
        FatigueAnalysisResult analysis)
    {
        if (availableTrainingTemplates is 0)
        {
            return 0;
        }

        var baselineFrequency = Math.Min(availableTrainingTemplates, 6);

        if (analysis.TotalFatigueScore >= FrequencyReductionFatigueThreshold)
        {
            return Math.Max(4, baselineFrequency - 1);
        }

        return baselineFrequency;
    }

    private static WorkoutDay ProjectWorkout(WorkoutDay template, DateOnly date, int weekNumber)
    {
        var notes = string.IsNullOrWhiteSpace(template.Notes)
            ? $"Projected week {weekNumber}: keep 1-3 reps in reserve on working sets."
            : $"{template.Notes} Projected week {weekNumber}.";

        return template with
        {
            Date = date,
            Notes = notes
        };
    }

    private static WorkoutDay CreateRestDay(DateOnly date, string notes)
    {
        return new WorkoutDay(
            date,
            WorkoutType.Rest,
            [],
            DurationMinutes: 0,
            IntensityLevel.Low,
            notes);
    }
}
