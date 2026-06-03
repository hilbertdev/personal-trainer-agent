namespace Training.Domain.Entities;

public sealed record Mesocycle(
    Guid Id,
    int Sequence,
    DateOnly StartsOn,
    DateOnly EndsOn,
    IReadOnlyList<Microcycle> Microcycles);
