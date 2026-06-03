namespace Training.Domain.Entities;

public sealed record TrainingProgram(
    Guid Id,
    string Name,
    Guid AthleteId,
    DateOnly StartDate,
    DateOnly? EndDate,
    IReadOnlyList<Mesocycle> Mesocycles);
