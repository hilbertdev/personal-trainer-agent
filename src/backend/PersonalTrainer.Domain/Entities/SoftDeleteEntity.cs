namespace PersonalTrainer.Domain.Entities;

public abstract class SoftDeleteEntity : BaseEntity
{
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAtUtc { get; private set; }

    public void SoftDelete()
    {
        IsDeleted = true;
        DeletedAtUtc = DateTime.UtcNow;
    }
}
