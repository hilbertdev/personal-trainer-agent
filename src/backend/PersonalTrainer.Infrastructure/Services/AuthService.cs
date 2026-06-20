using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using PersonalTrainer.Application.DTOs.Auth;
using PersonalTrainer.Application.Exceptions;
using PersonalTrainer.Application.Services.Interfaces;
using PersonalTrainer.Domain.Entities;
using PersonalTrainer.Infrastructure.Data;

namespace PersonalTrainer.Infrastructure.Services;

public class AuthService(
    AppDbContext db,
    IOtpService otpService,
    IEmailService emailService,
    ICacheService cache,
    IConfiguration configuration,
    ILogger<AuthService> logger) : IAuthService
{
    private const int MaxAttempts = 5;
    private static readonly TimeSpan OtpLifetime = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan RateLimitWindow = TimeSpan.FromMinutes(15);

    public async Task RequestOtpAsync(string email, CancellationToken ct = default)
    {
        var normalizedEmail = NormalizeEmail(email);
        var rateLimitKey = $"otp:rate:{normalizedEmail}";
        var attempts = await cache.GetAsync<int>(rateLimitKey, ct);
        if (attempts >= MaxAttempts)
        {
            throw new ValidationException("Too many OTP requests. Try again later.");
        }

        var code = otpService.GenerateCode();
        var challenge = new OtpChallenge
        {
            Email = normalizedEmail,
            CodeHash = otpService.HashCode(code),
            ExpiresAtUtc = DateTime.UtcNow.Add(OtpLifetime)
        };

        db.OtpChallenges.Add(challenge);
        await db.SaveChangesAsync(ct);
        await emailService.SendOtpAsync(normalizedEmail, code, ct);
        await cache.SetAsync(rateLimitKey, attempts + 1, RateLimitWindow, ct);
        logger.LogInformation("OTP sent to {Email}", normalizedEmail);
    }

    public async Task<AuthResponseDto> VerifyOtpAsync(string email, string code, CancellationToken ct = default)
    {
        var normalizedEmail = NormalizeEmail(email);
        var challenge = await db.OtpChallenges
            .Where(x => x.Email == normalizedEmail && !x.IsUsed && x.ExpiresAtUtc > DateTime.UtcNow)
            .OrderByDescending(x => x.CreatedAtUtc)
            .FirstOrDefaultAsync(ct)
            ?? throw new UnauthorizedException("Invalid or expired OTP.");

        challenge.AttemptCount++;
        if (!otpService.VerifyCode(code, challenge.CodeHash))
        {
            await db.SaveChangesAsync(ct);
            throw new UnauthorizedException("Invalid or expired OTP.");
        }

        challenge.IsUsed = true;
        var user = await db.Users.FirstOrDefaultAsync(x => x.Email == normalizedEmail, ct);
        if (user is null)
        {
            user = new User
            {
                Email = normalizedEmail,
                DisplayName = normalizedEmail.Split('@')[0]
            };
            db.Users.Add(user);
        }

        await db.SaveChangesAsync(ct);

        var membership = await db.OrganizationMembers
            .Include(x => x.Organization)
            .Where(x => x.UserId == user.Id)
            .OrderBy(x => x.CreatedAtUtc)
            .FirstOrDefaultAsync(ct);

        Guid organizationId;
        if (membership is null)
        {
            var organization = new Organization
            {
                Name = $"{user.DisplayName}'s Workspace",
                Slug = await CreateUniqueSlugAsync(user.DisplayName, ct)
            };
            db.Organizations.Add(organization);
            db.OrganizationMembers.Add(new OrganizationMember
            {
                OrganizationId = organization.Id,
                UserId = user.Id,
                Role = "Admin"
            });
            await db.SaveChangesAsync(ct);
            organizationId = organization.Id;
        }
        else
        {
            organizationId = membership.OrganizationId;
        }

        var expiresAt = DateTime.UtcNow.AddMinutes(GetTokenExpiryMinutes());
        var token = GenerateToken(user.Id, organizationId, user.Email);
        return new AuthResponseDto(token, expiresAt, user.Id, organizationId, user.Email, user.DisplayName);
    }

    public string GenerateToken(Guid userId, Guid organizationId, string email)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetJwtKey()));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(GetTokenExpiryMinutes());

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim("orgId", organizationId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email)
        };

        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<string> CreateUniqueSlugAsync(string name, CancellationToken ct)
    {
        var baseSlug = new string(name.ToLowerInvariant()
            .Select(c => char.IsLetterOrDigit(c) ? c : '-')
            .ToArray())
            .Trim('-');

        if (string.IsNullOrWhiteSpace(baseSlug))
        {
            baseSlug = "workspace";
        }

        var slug = baseSlug;
        var suffix = 1;
        while (await db.Organizations.AnyAsync(x => x.Slug == slug, ct))
        {
            slug = $"{baseSlug}-{suffix++}";
        }

        return slug;
    }

    private int GetTokenExpiryMinutes() => int.TryParse(configuration["Jwt:ExpiryMinutes"], out var minutes) ? minutes : 60;

    private string GetJwtKey()
    {
        var key = configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(key) || key.Length < 32)
        {
            throw new InvalidOperationException("Jwt:Key must be at least 32 characters.");
        }

        return key;
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
