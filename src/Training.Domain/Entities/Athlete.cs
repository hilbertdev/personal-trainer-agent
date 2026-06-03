namespace Training.Domain.Entities;

public sealed record Athlete(
    Guid Id,
    string DisplayName,
    DateOnly? DateOfBirth,
    DateTimeOffset CreatedAt);
