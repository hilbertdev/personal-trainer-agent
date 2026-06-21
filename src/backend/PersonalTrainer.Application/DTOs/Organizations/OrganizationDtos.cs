namespace PersonalTrainer.Application.DTOs.Organizations;

public record OrganizationDto(Guid Id, string Name, string Slug, DateTime CreatedAtUtc);

public record CreateOrganizationDto(string Name, string? Slug);
