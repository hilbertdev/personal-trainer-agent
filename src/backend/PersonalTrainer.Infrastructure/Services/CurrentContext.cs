using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using PersonalTrainer.Application.Services.Interfaces;

namespace PersonalTrainer.Infrastructure.Services;

public class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    private ClaimsPrincipal? User => httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated == true;

    public Guid Id
    {
        get
        {
            var value = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User?.FindFirst("sub")?.Value;
            return Guid.TryParse(value, out var id) ? id : Guid.Empty;
        }
    }

    public string Email =>
        User?.FindFirst(ClaimTypes.Email)?.Value
        ?? User?.FindFirst("email")?.Value
        ?? string.Empty;
}

public class CurrentOrganization(IHttpContextAccessor httpContextAccessor) : ICurrentOrganization
{
    private ClaimsPrincipal? User => httpContextAccessor.HttpContext?.User;
    private string? HeaderOrgId => httpContextAccessor.HttpContext?.Request.Headers["X-Organization-Id"];

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated == true;

    public Guid Id
    {
        get
        {
            if (Guid.TryParse(HeaderOrgId, out var headerId))
            {
                return headerId;
            }

            var value = User?.FindFirst("orgId")?.Value;
            return Guid.TryParse(value, out var claimId) ? claimId : Guid.Empty;
        }
    }
}
