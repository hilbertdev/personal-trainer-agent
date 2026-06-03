using Training.Domain.Enums;
using Training.Domain.ValueObjects;

namespace Training.Domain.Entities;

public sealed record ExerciseTemplate(
    Guid Id,
    string ExerciseName,
    int TargetSets,
    RepRange TargetRepRange,
    string? Notes,
    ExerciseCategory Category);
