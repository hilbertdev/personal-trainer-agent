using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PersonalTrainer.Application.Services.Interfaces;

namespace PersonalTrainer.Infrastructure.Services;

public class EmailService(
    IConfiguration configuration,
    ILogger<EmailService> logger) : IEmailService
{
    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        var smtpHost = configuration["Smtp:Host"];
        if (!string.IsNullOrWhiteSpace(smtpHost))
        {
            await SendViaSmtpAsync(to, subject, htmlBody, ct);
            return;
        }

        logger.LogInformation("Email queued for {Recipient} with subject {Subject}", to, subject);
        await Task.CompletedTask;
    }

    public Task SendOtpAsync(string to, string code, CancellationToken ct = default)
    {
        const string subject = "Your Personal Trainer sign-in code";
        var body = $"""
            <p>Your one-time sign-in code is:</p>
            <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">{WebUtility.HtmlEncode(code)}</p>
            <p>This code expires in 10 minutes.</p>
            """;
        return SendAsync(to, subject, body, ct);
    }

    private async Task SendViaSmtpAsync(string to, string subject, string htmlBody, CancellationToken ct)
    {
        var from = configuration["Resend:From"] ?? "Personal Trainer <noreply@localhost>";
        var host = configuration["Smtp:Host"]!;
        var port = int.Parse(configuration["Smtp:Port"] ?? "25");

        using var client = new SmtpClient(host, port) { EnableSsl = false };
        using var message = new MailMessage(from, to, subject, htmlBody) { IsBodyHtml = true };
        await client.SendMailAsync(message, ct);
        logger.LogInformation("OTP email sent to {Recipient}", to);
    }
}
