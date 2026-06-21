using Microsoft.EntityFrameworkCore;
using PersonalTrainer.Application.DTOs.Organizations;
using PersonalTrainer.Application.Exceptions;
using PersonalTrainer.Application.Services.Interfaces;
using PersonalTrainer.Domain.Entities;
using PersonalTrainer.Infrastructure.Data;

namespace PersonalTrainer.Infrastructure.Services;

public class OrganizationService(
    AppDbContext db,
    ICurrentUser currentUser) : IOrganizationService
{
    public async Task<IReadOnlyList<OrganizationDto>> ListAsync(CancellationToken ct = default)
    {
        EnsureAuthenticated();

        return await db.OrganizationMembers
            .Where(x => x.UserId == currentUser.Id)
            .Select(x => x.Organization)
            .OrderBy(x => x.Name)
            .Select(x => new OrganizationDto(x.Id, x.Name, x.Slug, x.CreatedAtUtc))
            .ToListAsync(ct);
    }

    public async Task<OrganizationDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        EnsureAuthenticated();

        var organization = await db.Organizations
            .Where(x => x.Id == id)
            .Where(x => db.OrganizationMembers.Any(m => m.OrganizationId == x.Id && m.UserId == currentUser.Id))
            .FirstOrDefaultAsync(ct);

        return organization is null
            ? null
            : new OrganizationDto(organization.Id, organization.Name, organization.Slug, organization.CreatedAtUtc);
    }

    public async Task<Guid> CreateAsync(CreateOrganizationDto dto, CancellationToken ct = default)
    {
        EnsureAuthenticated();

        var slug = string.IsNullOrWhiteSpace(dto.Slug)
            ? Slugify(dto.Name)
            : Slugify(dto.Slug);

        if (await db.Organizations.AnyAsync(x => x.Slug == slug, ct))
        {
            throw new ValidationException($"Organization slug '{slug}' is already taken.");
        }

        var organization = new Organization
        {
            Name = dto.Name.Trim(),
            Slug = slug
        };

        db.Organizations.Add(organization);
        db.OrganizationMembers.Add(new OrganizationMember
        {
            OrganizationId = organization.Id,
            UserId = currentUser.Id,
            Role = "Admin"
        });

        await db.SaveChangesAsync(ct);
        return organization.Id;
    }

    private void EnsureAuthenticated()
    {
        if (!currentUser.IsAuthenticated)
        {
            throw new UnauthorizedException("Authentication required.");
        }
    }

    private static string Slugify(string value)
    {
        var slug = new string(value.ToLowerInvariant()
            .Select(c => char.IsLetterOrDigit(c) ? c : '-')
            .ToArray())
            .Trim('-');

        return string.IsNullOrWhiteSpace(slug) ? "workspace" : slug;
    }
}
