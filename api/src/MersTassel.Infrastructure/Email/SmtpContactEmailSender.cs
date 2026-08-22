using System.Net;
using System.Net.Mail;
using System.Text;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using Microsoft.Extensions.Options;

namespace MersTassel.Infrastructure.Email;

public class SmtpContactEmailSender(IOptions<EmailOptions> configured) : IContactEmailSender
{
    private readonly EmailOptions _options = configured.Value;

    public async Task SendAsync(ContactMessageRequest request, int reference, CancellationToken ct = default)
    {
        EnsureConfigured();

        var topic = request.Topic switch
        {
            "order" => "Order question",
            "repairs" => "Repairs & care",
            "press" => "Press & partnerships",
            _ => "Product question",
        };

        using var message = new MailMessage
        {
            From = new MailAddress(_options.Username, _options.FromName, Encoding.UTF8),
            Subject = $"[MERS contact #{reference}] {topic}",
            SubjectEncoding = Encoding.UTF8,
            BodyEncoding = Encoding.UTF8,
            IsBodyHtml = false,
            Body = $"""
                New message from the MERS Tassel contact form

                Reference: #{reference}
                Name: {request.Name.Trim()}
                Customer email: {request.Email.Trim()}
                Topic: {topic}
                Language: {request.Locale.ToUpperInvariant()}

                Message:
                {request.Message.Trim()}

                Reply to this email to answer the customer directly.
                """,
        };

        message.To.Add(new MailAddress(_options.Recipient));
        message.ReplyToList.Add(new MailAddress(request.Email.Trim(), request.Name.Trim(), Encoding.UTF8));

        using var smtp = new SmtpClient(_options.SmtpHost, _options.SmtpPort)
        {
            EnableSsl = _options.UseSsl,
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(_options.Username, _options.AppPassword),
            DeliveryMethod = SmtpDeliveryMethod.Network,
            Timeout = 15_000,
        };

        try
        {
            await smtp.SendMailAsync(message, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex) when (ex is SmtpException or InvalidOperationException)
        {
            throw new DeliveryException(
                "email_delivery_failed",
                "Your note could not be delivered right now. Please try again or email the atelier directly.",
                ex);
        }
    }

    private void EnsureConfigured()
    {
        if (!string.IsNullOrWhiteSpace(_options.SmtpHost) &&
            !string.IsNullOrWhiteSpace(_options.Username) &&
            !string.IsNullOrWhiteSpace(_options.AppPassword) &&
            !string.IsNullOrWhiteSpace(_options.Recipient)) return;

        throw new NotConfiguredException(
            "email_not_configured",
            "Contact email is not configured yet. Please email the atelier directly.");
    }
}
