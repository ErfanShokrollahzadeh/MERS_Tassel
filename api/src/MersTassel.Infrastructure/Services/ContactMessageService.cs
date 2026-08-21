using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Infrastructure.Data;

namespace MersTassel.Infrastructure.Services;

public class ContactMessageService(AppDbContext db, IContactEmailSender emailSender) : IContactMessageService
{
    public async Task<ContactMessageReceiptDto> SendAsync(
        ContactMessageRequest request, CancellationToken ct = default)
    {
        var record = new ContactMessage
        {
            Name = request.Name.Trim(),
            Email = request.Email.Trim(),
            Topic = request.Topic,
            Message = request.Message.Trim(),
            Locale = request.Locale,
            DeliveryStatus = "Pending",
        };

        db.ContactMessages.Add(record);
        await db.SaveChangesAsync(ct);

        try
        {
            await emailSender.SendAsync(request, record.Id, ct);
            record.DeliveryStatus = "Sent";
            record.SentAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);
        }
        catch
        {
            record.DeliveryStatus = "Failed";
            await db.SaveChangesAsync(CancellationToken.None);
            throw;
        }

        return new ContactMessageReceiptDto
        {
            Reference = record.Id,
            ReceivedAt = record.CreatedAt,
        };
    }
}
