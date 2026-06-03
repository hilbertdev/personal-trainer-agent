using Training.Domain.Enums;

namespace Training.Domain.Entities;

public sealed record Exercise(
    string Name,
    int Sets,
    string Reps,
    string? RirOrRpe,
    IReadOnlyList<MuscleGroup> MuscleGroups);
