using MersTassel.Domain.Common;

namespace MersTassel.Domain.Entities;

public class SupportTicket : SoftDeletableEntity
{
    public string Number { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Category { get; set; } = "general";
    public string Priority { get; set; } = "normal";
    public string Status { get; set; } = "open";
    public string CustomerId { get; set; } = string.Empty;
    public AppUser Customer { get; set; } = null!;
    public int? OrderId { get; set; }
    public Order? Order { get; set; }
    public string? AssignedToId { get; set; }
    public AppUser? AssignedTo { get; set; }
    public DateTimeOffset? FirstRespondedAt { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public ICollection<SupportMessage> Messages { get; set; } = new List<SupportMessage>();
}

public class SupportMessage : SoftDeletableEntity
{
    public int TicketId { get; set; }
    public SupportTicket Ticket { get; set; } = null!;
    public string AuthorId { get; set; } = string.Empty;
    public AppUser Author { get; set; } = null!;
    public string Body { get; set; } = string.Empty;
    public bool IsInternal { get; set; }
}

public class CannedSupportResponse : SoftDeletableEntity
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
}
