namespace WorkoutPlanner.Domain.Entities;

public sealed class StravaConnection
{
    public Guid Id { get; set; }

    public long AthleteId { get; set; }

    public string AccessToken { get; set; } = string.Empty;

    public string RefreshToken { get; set; } = string.Empty;

    public DateTime ExpiresAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; }
}
