using Training.Domain.Enums;
using Training.Domain.ValueObjects;

namespace Training.Domain.Entities;

public sealed record ExerciseTemplate(
    Guid Id,
    string ExerciseName,
    string? WarmupSets,
    int TargetSets,
    RepRange TargetRepRange,
    string? EarlySetRpe,
    string? LastSetRpe,
    string? RestTime,
    string? LastSetIntensityTechnique,
    string? Notes,
    ExerciseCategory Category,
    IReadOnlyList<ExerciseTemplateSubstitution> Substitutions);
