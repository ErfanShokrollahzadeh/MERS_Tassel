using MersTassel.Domain.Common;

namespace MersTassel.Domain.Entities;

public class ContactMessage : SoftDeletableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Topic { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Locale { get; set; } = "en";
    public string DeliveryStatus { get; set; } = "Pending";
    public DateTimeOffset? SentAt { get; set; }
}
