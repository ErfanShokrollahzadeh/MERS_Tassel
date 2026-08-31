using MersTassel.Domain.Common;
using MersTassel.Domain.Enums;

namespace MersTassel.Domain.Entities;

/// <summary>
/// A durable customer-care conversation. Customer identity is snapshotted so the operational
/// record remains intelligible if an account is later removed, while the nullable relationship
/// still enables order and account context for active customers.
/// </summary>
public class SupportTicket : SoftDeletableEntity
{
    public string Number { get; set; } = string.Empty;
    public string? CustomerId { get; set; }
    public AppUser? Customer { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;

    public int? OrderId { get; set; }
    public Order? Order { get; set; }
    public string Subject { get; set; } = string.Empty;
    public SupportTicketCategory Category { get; set; } = SupportTicketCategory.Other;
    public SupportTicketStatus Status { get; set; } = SupportTicketStatus.Open;
    public SupportTicketPriority Priority { get; set; } = SupportTicketPriority.Normal;

    public string? AssignedToUserId { get; set; }
    public AppUser? AssignedToUser { get; set; }

    public DateTimeOffset LastMessageAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastCustomerReplyAt { get; set; }
    public DateTimeOffset? LastStaffReplyAt { get; set; }
    public DateTimeOffset? CustomerReadAt { get; set; }
    public DateTimeOffset? StaffReadAt { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public DateTimeOffset? ClosedAt { get; set; }

    public ICollection<SupportTicketMessage> Messages { get; set; } = new List<SupportTicketMessage>();
}

/// <summary>
/// Append-only ticket message. Author display data and the staff/customer side are snapshotted
/// so role changes never rewrite the historical thread. Internal notes are never returned to
/// customer endpoints.
/// </summary>
public class SupportTicketMessage
{
    public int Id { get; set; }
    public int TicketId { get; set; }
    public SupportTicket Ticket { get; set; } = null!;
    public string? AuthorUserId { get; set; }
    public AppUser? AuthorUser { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public bool IsStaff { get; set; }
    public bool IsInternal { get; set; }
    public string Body { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<SupportTicketAttachment> Attachments { get; set; } = new List<SupportTicketAttachment>();
}

/// <summary>Metadata for a file held in private ticket storage and served through an authorized endpoint.</summary>
public class SupportTicketAttachment
{
    public int Id { get; set; }
    public int MessageId { get; set; }
    public SupportTicketMessage Message { get; set; } = null!;
    public string StoragePath { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
