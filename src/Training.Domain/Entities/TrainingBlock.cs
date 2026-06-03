namespace Training.Domain.Entities;

public sealed record TrainingBlock(
    Guid Id,
    Guid AthleteId,
    string Name,
    DateOnly StartsOn,
    DateOnly EndsOn,
    IReadOnlyList<Mesocycle> Mesocycles);
