namespace PersonalTrainer.Domain.Entities;

public class Organization : SoftDeleteEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;

    public ICollection<OrganizationMember> Members { get; set; } = [];
}
