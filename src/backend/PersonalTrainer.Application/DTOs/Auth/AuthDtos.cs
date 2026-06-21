namespace PersonalTrainer.Application.DTOs.Auth;

public record RequestOtpDto(string Email);

public record VerifyOtpDto(string Email, string Code);

public record AuthResponseDto(
    string AccessToken,
    DateTime ExpiresAtUtc,
    Guid UserId,
    Guid OrganizationId,
    string Email,
    string DisplayName);
