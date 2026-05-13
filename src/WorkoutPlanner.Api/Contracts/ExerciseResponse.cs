using WorkoutPlanner.Domain.Enums;

namespace WorkoutPlanner.Api.Contracts;

public sealed record ExerciseResponse(
    string Name,
    int Sets,
    string Reps,
    string? RirOrRpe,
    IReadOnlyList<MuscleGroup> MuscleGroups);
