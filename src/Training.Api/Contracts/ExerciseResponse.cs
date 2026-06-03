using Training.Domain.Enums;

namespace Training.Api.Contracts;

public sealed record ExerciseResponse(
    string Name,
    int Sets,
    string Reps,
    string? RirOrRpe,
    IReadOnlyList<MuscleGroup> MuscleGroups);
