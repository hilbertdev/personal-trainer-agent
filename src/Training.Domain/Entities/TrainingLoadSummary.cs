namespace Training.Domain.Entities;

public sealed record TrainingLoadSummary(
    Guid AthleteId,
    DateOnly Date,
    decimal Load);
