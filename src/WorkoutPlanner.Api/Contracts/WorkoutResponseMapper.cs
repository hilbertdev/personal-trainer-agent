using WorkoutPlanner.Domain.Entities;
using WorkoutPlanner.Domain.Enums;

namespace WorkoutPlanner.Api.Contracts;

public static class WorkoutResponseMapper
{
    public static WorkoutWeekResponse ToWeekResponse(IReadOnlyList<WorkoutDay> workouts)
    {
        var orderedWorkouts = workouts.OrderBy(workout => workout.Date).ToList();

        return new WorkoutWeekResponse(
            ToSummaryResponse(orderedWorkouts),
            orderedWorkouts.Select(ToWorkoutDayResponse).ToList());
    }

    public static WorkoutSummaryResponse ToSummaryResponse(IReadOnlyList<WorkoutDay> workouts)
    {
        var orderedWorkouts = workouts.OrderBy(workout => workout.Date).ToList();
        var trainingDays = orderedWorkouts.Where(workout => !workout.IsRestDay).ToList();

        var setsByMuscleGroup = orderedWorkouts
            .SelectMany(workout => workout.Exercises)
            .SelectMany(exercise => exercise.MuscleGroups.Select(group => new { Group = group, exercise.Sets }))
            .GroupBy(item => item.Group.ToString())
            .OrderBy(group => group.Key)
            .ToDictionary(group => group.Key, group => group.Sum(item => item.Sets));

        var workoutsByType = orderedWorkouts
            .GroupBy(workout => workout.WorkoutType.ToString())
            .OrderBy(group => group.Key)
            .ToDictionary(group => group.Key, group => group.Count());

        return new WorkoutSummaryResponse(
            orderedWorkouts.Count is 0 ? null : orderedWorkouts[0].Date,
            orderedWorkouts.Count is 0 ? null : orderedWorkouts[^1].Date,
            orderedWorkouts.Count,
            trainingDays.Count,
            orderedWorkouts.Count - trainingDays.Count,
            trainingDays.Count(workout => workout.Intensity is IntensityLevel.High),
            orderedWorkouts.Sum(workout => workout.TotalSets),
            orderedWorkouts.Sum(workout => workout.DurationMinutes),
            setsByMuscleGroup,
            workoutsByType);
    }

    public static FatigueAnalysisResponse ToAnalysisResponse(FatigueAnalysisResult analysis)
    {
        return new FatigueAnalysisResponse(
            analysis.TotalFatigueScore,
            analysis.EstimatedFatigue,
            analysis.Warnings,
            analysis.RecommendedRestDays);
    }

    public static ProjectedWeekResponse ToProjectedWeekResponse(ProjectedWeek projectedWeek)
    {
        return new ProjectedWeekResponse(
            projectedWeek.WeekNumber,
            projectedWeek.Workouts
                .OrderBy(workout => workout.Date)
                .Select(ToWorkoutDayResponse)
                .ToList());
    }

    private static WorkoutDayResponse ToWorkoutDayResponse(WorkoutDay workout)
    {
        return new WorkoutDayResponse(
            workout.Date,
            workout.WorkoutType,
            workout.Intensity,
            workout.DurationMinutes,
            workout.Notes,
            workout.IsRestDay,
            workout.TotalSets,
            workout.TrainedMuscleGroups.OrderBy(group => group.ToString()).ToList(),
            workout.Exercises.Select(ToExerciseResponse).ToList());
    }

    private static ExerciseResponse ToExerciseResponse(Exercise exercise)
    {
        return new ExerciseResponse(
            exercise.Name,
            exercise.Sets,
            exercise.Reps,
            exercise.RirOrRpe,
            exercise.MuscleGroups);
    }
}
