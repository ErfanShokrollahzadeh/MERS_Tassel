namespace MersTassel.Application.DTOs;

public record CreateSupportTicketRequest(string Subject, string Category, string Priority, int? OrderId, string Message);
public record AddSupportMessageRequest(string Body, bool IsInternal = false);
public record UpdateSupportTicketRequest(string? Status, string? Priority, string? AssignedToId);
public record SupportTicketQuery(string? Search = null, string? Status = null, string? Priority = null, int Page = 1, int PageSize = 50);

public class SupportMessageDto
{
    public int Id { get; set; }
    public string AuthorId { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsInternal { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class SupportTicketDto
{
    public int Id { get; set; }
    public string Number { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string CustomerId { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public int? OrderId { get; set; }
    public string? OrderNumber { get; set; }
    public string? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? FirstRespondedAt { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public IReadOnlyList<SupportMessageDto> Messages { get; set; } = [];
}
