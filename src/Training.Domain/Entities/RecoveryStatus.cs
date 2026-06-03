using Training.Domain.Enums;

namespace Training.Domain.Entities;

public sealed record RecoveryStatus(
    RecoveryReadiness Readiness,
    IReadOnlyList<string> PositiveMarkers,
    IReadOnlyList<string> RiskMarkers);
