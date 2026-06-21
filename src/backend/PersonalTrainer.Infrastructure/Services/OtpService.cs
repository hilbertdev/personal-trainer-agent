using System.Security.Cryptography;

namespace PersonalTrainer.Infrastructure.Services;

public class OtpService : Application.Services.Interfaces.IOtpService
{
    public string GenerateCode() => RandomNumberGenerator.GetInt32(100_000, 1_000_000).ToString();

    public string HashCode(string code) => BCrypt.Net.BCrypt.HashPassword(code);

    public bool VerifyCode(string code, string hash) => BCrypt.Net.BCrypt.Verify(code, hash);
}
