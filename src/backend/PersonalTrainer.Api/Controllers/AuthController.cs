using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PersonalTrainer.Application.DTOs.Auth;
using PersonalTrainer.Application.Services.Interfaces;

namespace PersonalTrainer.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("request-otp")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> RequestOtp(RequestOtpDto dto, CancellationToken ct)
    {
        await authService.RequestOtpAsync(dto.Email, ct);
        return Accepted(new { message = "If the email is valid, an OTP has been sent." });
    }

    [HttpPost("verify-otp")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> VerifyOtp(VerifyOtpDto dto, CancellationToken ct)
    {
        var result = await authService.VerifyOtpAsync(dto.Email, dto.Code, ct);
        return Ok(result);
    }
}
