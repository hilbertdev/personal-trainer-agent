using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using PersonalTrainer.Application.DTOs.Auth;
using PersonalTrainer.Application.Exceptions;
using PersonalTrainer.Infrastructure.Data;
using PersonalTrainer.Infrastructure.Services;

namespace PersonalTrainer.Tests;

public class AuthServiceTests
{
    [Fact]
    public async Task RequestOtpAsync_PersistsChallenge()
    {
        await using var db = CreateDbContext();
        var service = CreateAuthService(db, new TestEmailService());

        await service.RequestOtpAsync("athlete@example.com");

        Assert.Single(db.OtpChallenges);
        Assert.Equal("athlete@example.com", db.OtpChallenges.Single().Email);
    }

    [Fact]
    public async Task VerifyOtpAsync_WithValidCode_ReturnsToken()
    {
        await using var db = CreateDbContext();
        var emailService = new TestEmailService();
        var service = CreateAuthService(db, emailService);

        await service.RequestOtpAsync("athlete@example.com");
        var code = emailService.LastCode ?? throw new InvalidOperationException("OTP was not captured.");

        var result = await service.VerifyOtpAsync("athlete@example.com", code);

        Assert.False(string.IsNullOrWhiteSpace(result.AccessToken));
        Assert.Equal("athlete@example.com", result.Email);
        Assert.NotEqual(Guid.Empty, result.OrganizationId);
    }

    [Fact]
    public async Task VerifyOtpAsync_WithInvalidCode_ThrowsUnauthorized()
    {
        await using var db = CreateDbContext();
        var service = CreateAuthService(db, new TestEmailService());
        await service.RequestOtpAsync("athlete@example.com");

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            service.VerifyOtpAsync("athlete@example.com", "000000"));
    }

    private static AuthService CreateAuthService(AppDbContext db, TestEmailService emailService)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "super-secret-jwt-key-min-32-chars!!",
                ["Jwt:Issuer"] = "personal-trainer-api",
                ["Jwt:Audience"] = "personal-trainer-app"
            })
            .Build();

        return new AuthService(
            db,
            new OtpService(),
            emailService,
            new MemoryCacheService(),
            configuration,
            NullLogger<AuthService>.Instance);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private sealed class TestEmailService : Application.Services.Interfaces.IEmailService
    {
        public string? LastCode { get; private set; }

        public Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
            => Task.CompletedTask;

        public Task SendOtpAsync(string to, string code, CancellationToken ct = default)
        {
            LastCode = code;
            return Task.CompletedTask;
        }
    }

    private sealed class MemoryCacheService : Application.Services.Interfaces.ICacheService
    {
        private readonly Dictionary<string, object> _cache = new();

        public Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
        {
            if (_cache.TryGetValue(key, out var value) && value is T typed)
            {
                return Task.FromResult<T?>(typed);
            }

            return Task.FromResult<T?>(default);
        }

        public Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default)
        {
            _cache[key] = value!;
            return Task.CompletedTask;
        }

        public Task RemoveAsync(string key, CancellationToken ct = default)
        {
            _cache.Remove(key);
            return Task.CompletedTask;
        }
    }
}
