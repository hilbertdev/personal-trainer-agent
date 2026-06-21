using PersonalTrainer.Application.DTOs.Organizations;

namespace PersonalTrainer.Application.Services.Interfaces;

public interface IOrganizationService
{
    Task<IReadOnlyList<OrganizationDto>> ListAsync(CancellationToken ct = default);
    Task<OrganizationDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Guid> CreateAsync(CreateOrganizationDto dto, CancellationToken ct = default);
}
