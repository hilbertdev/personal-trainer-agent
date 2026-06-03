namespace Training.Domain.Entities;

public sealed record Microcycle(
    Guid Id,
    int Sequence,
    DateOnly StartsOn,
    DateOnly EndsOn,
    IReadOnlyList<Workout> Workouts);
