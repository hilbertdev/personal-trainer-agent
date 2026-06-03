namespace Training.Domain.Entities;

public sealed record UserPlan(
    Guid Id,
    string Name,
    DateOnly WeekStartDate,
    DateTimeOffset CreatedAt);
