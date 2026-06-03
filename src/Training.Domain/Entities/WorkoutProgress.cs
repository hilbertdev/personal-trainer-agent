namespace Training.Domain.Entities;

public sealed record WorkoutProgress(IReadOnlyList<CompletedWorkout> CompletedWorkouts)
{
    public int CompletedCount => CompletedWorkouts.Count;

    public DateOnly? LastCompletedWorkoutDate => CompletedWorkouts
        .OrderByDescending(workout => workout.WorkoutDate)
        .FirstOrDefault()
        ?.WorkoutDate;
}
