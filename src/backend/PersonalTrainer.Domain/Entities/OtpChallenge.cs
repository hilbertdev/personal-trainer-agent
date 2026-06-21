namespace PersonalTrainer.Domain.Entities;

public class OtpChallenge : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string CodeHash { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public bool IsUsed { get; set; }
    public int AttemptCount { get; set; }
}
