using WorkoutPlanner.Domain.Entities;
using WorkoutPlanner.Domain.Enums;

namespace WorkoutPlanner.Application.Analysis;

public sealed class FatigueScoreCalculator
{
    private static readonly string[] CompoundMovementKeywords =
    [
        "squat",
        "deadlift",
        "bench",
        "press",
        "row",
        "pull-up",
        "pullup",
        "lunge",
        "rdl"
    ];

    public int CalculateWeeklyScore(IReadOnlyList<WorkoutDay> workouts)
    {
        var orderedWorkouts = workouts.OrderBy(workout => workout.Date);
        var consecutiveTrainingDays = 0;
        var totalScore = 0;

        foreach (var workout in orderedWorkouts)
        {
            if (workout.IsRestDay)
            {
                consecutiveTrainingDays = 0;
                continue;
            }

            consecutiveTrainingDays++;
            var consecutiveLoad = Math.Min(8, (consecutiveTrainingDays - 1) * 2);

            totalScore += CalculateWorkoutScore(workout) + consecutiveLoad;
        }

        return totalScore;
    }

    public int CalculateWorkoutScore(WorkoutDay workout)
    {
        if (workout.IsRestDay)
        {
            return 0;
        }

        var intensityScore = workout.Intensity switch
        {
            IntensityLevel.Low => 6,
            IntensityLevel.Moderate => 12,
            IntensityLevel.High => 18,
            _ => 0
        };

        var durationScore = workout.DurationMinutes switch
        {
            > 90 => 6,
            > 75 => 4,
            > 60 => 2,
            _ => 0
        };

        var setVolumeScore = workout.TotalSets / 6;
        var legBias = workout.TrainsLegs ? 5 : 0;
        var splitBias = workout.WorkoutType switch
        {
            WorkoutType.Legs or WorkoutType.Lower => 3,
            WorkoutType.FullBody => 4,
            _ => 0
        };

        var compoundMovementBias = Math.Min(
            4,
            workout.Exercises.Count(exercise => CompoundMovementKeywords.Any(
                keyword => exercise.Name.Contains(keyword, StringComparison.OrdinalIgnoreCase))) * 2);

        return intensityScore + durationScore + setVolumeScore + legBias + splitBias + compoundMovementBias;
    }
}
