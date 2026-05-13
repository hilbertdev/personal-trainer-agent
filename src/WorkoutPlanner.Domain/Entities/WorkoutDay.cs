using WorkoutPlanner.Domain.Enums;

namespace WorkoutPlanner.Domain.Entities;

public sealed record WorkoutDay(
    DateOnly Date,
    WorkoutType WorkoutType,
    IReadOnlyList<Exercise> Exercises,
    int DurationMinutes,
    IntensityLevel Intensity,
    string? Notes)
{
    private static readonly MuscleGroup[] LegMuscleGroups =
    [
        MuscleGroup.Quads,
        MuscleGroup.Hamstrings,
        MuscleGroup.Glutes,
        MuscleGroup.Calves
    ];

    public bool IsRestDay => WorkoutType is WorkoutType.Rest || Exercises.Count is 0;

    public int TotalSets => Exercises.Sum(exercise => exercise.Sets);

    public IReadOnlySet<MuscleGroup> TrainedMuscleGroups =>
        Exercises
            .SelectMany(exercise => exercise.MuscleGroups)
            .ToHashSet();

    public bool TrainsLegs =>
        TrainedMuscleGroups.Any(group => LegMuscleGroups.Contains(group));
}
