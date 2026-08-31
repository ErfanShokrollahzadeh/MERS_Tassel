using System.Net;
using System.Net.Mail;
using System.Text;
using MersTassel.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace MersTassel.Infrastructure.Email;

public class SmtpAuthEmailSender(
    IOptions<EmailOptions> configured,
    IConfiguration configuration) : IAuthEmailSender
{
    private readonly EmailOptions _options = configured.Value;
    private readonly string _clientUrl = (configuration["App:ClientUrl"] ?? "http://localhost:3000").TrimEnd('/');

    public async Task SendPasswordResetAsync(string email, string token, CancellationToken ct = default)
    {
        EnsureConfigured();

        var resetUrl = $"{_clientUrl}/reset-password?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";
        using var message = new MailMessage
        {
            From = new MailAddress(_options.Username, _options.FromName, Encoding.UTF8),
            Subject = "Reset your MERS Tassel password",
            SubjectEncoding = Encoding.UTF8,
            BodyEncoding = Encoding.UTF8,
            IsBodyHtml = true,
            Body = $"""
                <!doctype html>
                <html><body style="margin:0;background:#f6f1ed;color:#281d24;font-family:Arial,sans-serif">
                  <div style="max-width:560px;margin:32px auto;padding:40px;background:#fff;border-radius:16px">
                    <p style="letter-spacing:.18em;font-size:13px;color:#7b4058">MERS <em>Tassel</em></p>
                    <h1 style="font-family:Georgia,serif;font-weight:400">A fresh password, securely.</h1>
                    <p style="line-height:1.7;color:#65565e">We received a request to reset your password. Use the secure link below to choose a new one.</p>
                    <p style="margin:30px 0"><a href="{WebUtility.HtmlEncode(resetUrl)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#52243b;color:#fff;text-decoration:none">Reset password</a></p>
                    <p style="font-size:12px;line-height:1.6;color:#8b7d84">If you did not request this, you can safely ignore this email. The link can only be used once.</p>
                  </div>
                </body></html>
                """,
        };
        message.To.Add(new MailAddress(email));

        using var smtp = new SmtpClient(_options.SmtpHost, _options.SmtpPort)
        {
            EnableSsl = _options.UseSsl,
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(_options.Username, _options.AppPassword),
            DeliveryMethod = SmtpDeliveryMethod.Network,
            Timeout = 15_000,
        };
        await smtp.SendMailAsync(message, ct);
    }

    private void EnsureConfigured()
    {
        if (!string.IsNullOrWhiteSpace(_options.SmtpHost) &&
            !string.IsNullOrWhiteSpace(_options.Username) &&
            !string.IsNullOrWhiteSpace(_options.AppPassword)) return;

        throw new InvalidOperationException("Password reset email is not configured.");
    }
}
