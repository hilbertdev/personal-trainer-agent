using PersonalTrainer.Application.DTOs.Auth;

namespace PersonalTrainer.Application.Services.Interfaces;

public interface IAuthService
{
    Task RequestOtpAsync(string email, CancellationToken ct = default);
    Task<AuthResponseDto> VerifyOtpAsync(string email, string code, CancellationToken ct = default);
    string GenerateToken(Guid userId, Guid organizationId, string email);
}
