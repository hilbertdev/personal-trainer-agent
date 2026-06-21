namespace PersonalTrainer.Domain.Entities;

public class User : SoftDeleteEntity
{
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;

    public ICollection<OrganizationMember> Memberships { get; set; } = [];
}
