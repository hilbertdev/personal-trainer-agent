using Training.Domain.Entities;
using Training.Domain.Enums;

namespace Training.Application.Analysis;

public sealed class RecoveryHeuristicAnalyzer
{
    private const int HighFatigueWarningThreshold = 180;
    private const int VeryHighFatigueWarningThreshold = 220;

    public RecoveryAssessment Analyze(IReadOnlyList<WorkoutDay> workouts, int totalFatigueScore)
    {
        var orderedWorkouts = workouts.OrderBy(workout => workout.Date).ToList();
        var warnings = new List<string>();
        var recommendedRestDays = new HashSet<DateOnly>();

        AnalyzeConsecutiveTraining(orderedWorkouts, warnings, recommendedRestDays);
        AnalyzeHighIntensityClustering(orderedWorkouts, warnings, recommendedRestDays);
        AnalyzeLegDistribution(orderedWorkouts, warnings, recommendedRestDays);
        AnalyzeRecoveryWindows(orderedWorkouts, warnings, recommendedRestDays);
        AnalyzeWeeklyVolume(orderedWorkouts, warnings, recommendedRestDays);
        AnalyzeWeeklyFatigueScore(orderedWorkouts, totalFatigueScore, warnings, recommendedRestDays);

        return new RecoveryAssessment(
            warnings,
            recommendedRestDays.OrderBy(day => day).ToList());
    }

    private static void AnalyzeConsecutiveTraining(
        IReadOnlyList<WorkoutDay> workouts,
        List<string> warnings,
        HashSet<DateOnly> recommendedRestDays)
    {
        var consecutiveTrainingDays = 0;

        foreach (var workout in workouts)
        {
            if (workout.IsRestDay)
            {
                consecutiveTrainingDays = 0;
                continue;
            }

            consecutiveTrainingDays++;

            if (consecutiveTrainingDays is 4)
            {
                AddWarning(warnings, "4 consecutive training days detected");
                recommendedRestDays.Add(workout.Date.AddDays(1));
            }

            if (consecutiveTrainingDays is >= 6)
            {
                AddWarning(warnings, "6+ consecutive training days detected");
                recommendedRestDays.Add(workout.Date.AddDays(1));
            }
        }
    }

    private static void AnalyzeHighIntensityClustering(
        IReadOnlyList<WorkoutDay> workouts,
        List<string> warnings,
        HashSet<DateOnly> recommendedRestDays)
    {
        var consecutiveHighIntensityDays = 0;

        foreach (var workout in workouts)
        {
            if (workout.IsRestDay || workout.Intensity is not IntensityLevel.High)
            {
                consecutiveHighIntensityDays = 0;
                continue;
            }

            consecutiveHighIntensityDays++;

            if (consecutiveHighIntensityDays is 3)
            {
                AddWarning(warnings, "3 consecutive High intensity sessions detected");
                recommendedRestDays.Add(workout.Date.AddDays(1));
            }
        }

        foreach (var window in RollingWindows(workouts, windowSize: 4))
        {
            var highDays = window.Count(workout => !workout.IsRestDay && workout.Intensity is IntensityLevel.High);

            if (highDays >= 3)
            {
                AddWarning(warnings, "High intensity sessions are clustered too closely");
                recommendedRestDays.Add(window[^1].Date.AddDays(1));
                return;
            }
        }
    }

    private static void AnalyzeLegDistribution(
        IReadOnlyList<WorkoutDay> workouts,
        List<string> warnings,
        HashSet<DateOnly> recommendedRestDays)
    {
        WorkoutDay? lastLegSession = null;

        foreach (var workout in workouts.Where(workout => !workout.IsRestDay && workout.TrainsLegs))
        {
            if (lastLegSession is not null)
            {
                var hoursSinceLastLegSession = HoursBetween(lastLegSession.Date, workout.Date);

                if (hoursSinceLastLegSession <= 72)
                {
                    AddWarning(warnings, "Legs trained twice within 72h");
                    recommendedRestDays.Add(workout.Date.AddDays(1));
                }
            }

            lastLegSession = workout;
        }
    }

    private static void AnalyzeRecoveryWindows(
        IReadOnlyList<WorkoutDay> workouts,
        List<string> warnings,
        HashSet<DateOnly> recommendedRestDays)
    {
        var lastTrainingByRegion = new Dictionary<RecoveryRegion, WorkoutDay>();

        foreach (var workout in workouts.Where(workout => !workout.IsRestDay))
        {
            foreach (var region in GetRecoveryRegions(workout))
            {
                if (region is RecoveryRegion.Legs or RecoveryRegion.Core)
                {
                    continue;
                }

                if (lastTrainingByRegion.TryGetValue(region, out var previousWorkout))
                {
                    var requiredRecoveryHours = MinimumRecoveryHours(region);
                    var hoursSincePreviousSession = HoursBetween(previousWorkout.Date, workout.Date);

                    if (hoursSincePreviousSession < requiredRecoveryHours)
                    {
                        AddWarning(
                            warnings,
                            $"{FormatRegion(region)} retrained before a full {requiredRecoveryHours}h recovery window");

                        recommendedRestDays.Add(workout.Date.AddDays(1));
                    }
                }

                lastTrainingByRegion[region] = workout;
            }
        }
    }

    private static void AnalyzeWeeklyVolume(
        IReadOnlyList<WorkoutDay> workouts,
        List<string> warnings,
        HashSet<DateOnly> recommendedRestDays)
    {
        var totalSets = workouts.Sum(workout => workout.TotalSets);
        var legSets = workouts
            .Where(workout => workout.TrainsLegs)
            .Sum(workout => workout.TotalSets);

        if (totalSets > 90)
        {
            AddWarning(warnings, "Weekly training volume is high for a hypertrophy block");
            recommendedRestDays.Add(FindHighestFatigueDay(workouts).Date.AddDays(1));
        }

        if (legSets > 32)
        {
            AddWarning(warnings, "Leg volume is concentrated enough to increase lower-body fatigue");
            recommendedRestDays.Add(FindLastLegDay(workouts).Date.AddDays(1));
        }
    }

    private static void AnalyzeWeeklyFatigueScore(
        IReadOnlyList<WorkoutDay> workouts,
        int totalFatigueScore,
        List<string> warnings,
        HashSet<DateOnly> recommendedRestDays)
    {
        if (totalFatigueScore >= VeryHighFatigueWarningThreshold)
        {
            AddWarning(warnings, "Weekly fatigue score exceeds the projection reduction threshold");
            recommendedRestDays.Add(FindHighestFatigueDay(workouts).Date.AddDays(1));
            return;
        }

        if (totalFatigueScore >= HighFatigueWarningThreshold)
        {
            AddWarning(warnings, "Weekly fatigue score is high");
        }
    }

    private static IEnumerable<IReadOnlyList<WorkoutDay>> RollingWindows(
        IReadOnlyList<WorkoutDay> workouts,
        int windowSize)
    {
        for (var index = 0; index <= workouts.Count - windowSize; index++)
        {
            yield return workouts.Skip(index).Take(windowSize).ToList();
        }
    }

    private static IReadOnlySet<RecoveryRegion> GetRecoveryRegions(WorkoutDay workout)
    {
        return workout.TrainedMuscleGroups
            .SelectMany(ToRecoveryRegions)
            .ToHashSet();
    }

    private static IEnumerable<RecoveryRegion> ToRecoveryRegions(MuscleGroup muscleGroup)
    {
        return muscleGroup switch
        {
            MuscleGroup.Chest => [RecoveryRegion.Chest],
            MuscleGroup.Back => [RecoveryRegion.Back],
            MuscleGroup.Shoulders => [RecoveryRegion.Shoulders],
            MuscleGroup.Biceps or MuscleGroup.Triceps => [RecoveryRegion.Arms],
            MuscleGroup.Quads or MuscleGroup.Hamstrings or MuscleGroup.Glutes or MuscleGroup.Calves => [RecoveryRegion.Legs],
            MuscleGroup.Core => [RecoveryRegion.Core],
            _ => []
        };
    }

    private static int MinimumRecoveryHours(RecoveryRegion region)
    {
        return region switch
        {
            RecoveryRegion.Chest => 48,
            RecoveryRegion.Back => 48,
            RecoveryRegion.Shoulders => 24,
            RecoveryRegion.Arms => 24,
            _ => 24
        };
    }

    private static string FormatRegion(RecoveryRegion region)
    {
        return region switch
        {
            RecoveryRegion.Chest => "Chest",
            RecoveryRegion.Back => "Back",
            RecoveryRegion.Shoulders => "Shoulders",
            RecoveryRegion.Arms => "Arms",
            RecoveryRegion.Legs => "Legs",
            RecoveryRegion.Core => "Core",
            _ => region.ToString()
        };
    }

    private static WorkoutDay FindHighestFatigueDay(IReadOnlyList<WorkoutDay> workouts)
    {
        return workouts
            .Where(workout => !workout.IsRestDay)
            .MaxBy(workout => workout.DurationMinutes + workout.TotalSets + (workout.TrainsLegs ? 20 : 0))
            ?? workouts[0];
    }

    private static WorkoutDay FindLastLegDay(IReadOnlyList<WorkoutDay> workouts)
    {
        return workouts.LastOrDefault(workout => !workout.IsRestDay && workout.TrainsLegs)
            ?? FindHighestFatigueDay(workouts);
    }

    private static int HoursBetween(DateOnly earlier, DateOnly later)
    {
        return (later.DayNumber - earlier.DayNumber) * 24;
    }

    private static void AddWarning(List<string> warnings, string warning)
    {
        if (!warnings.Contains(warning, StringComparer.OrdinalIgnoreCase))
        {
            warnings.Add(warning);
        }
    }

    private enum RecoveryRegion
    {
        Chest,
        Back,
        Shoulders,
        Arms,
        Legs,
        Core
    }
}
