using Training.Domain.Enums;

namespace Training.Domain.Entities;

public sealed record Fatigue(
    FatigueLevel Level,
    int Score,
    IReadOnlyList<string> Markers);
