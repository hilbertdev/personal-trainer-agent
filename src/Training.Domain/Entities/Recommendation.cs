using Training.Domain.Enums;

namespace Training.Domain.Entities;

public sealed record Recommendation(
    RecommendationType Type,
    string Summary,
    string Rationale,
    DateTimeOffset CreatedAt);
