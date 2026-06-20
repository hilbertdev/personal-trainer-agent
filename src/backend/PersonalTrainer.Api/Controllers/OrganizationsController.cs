using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalTrainer.Application.DTOs.Organizations;
using PersonalTrainer.Application.Services.Interfaces;

namespace PersonalTrainer.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrganizationsController(IOrganizationService organizationService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
        => Ok(await organizationService.ListAsync(ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var result = await organizationService.GetByIdAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateOrganizationDto dto, CancellationToken ct)
    {
        var id = await organizationService.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(Get), new { id }, new { id });
    }
}
