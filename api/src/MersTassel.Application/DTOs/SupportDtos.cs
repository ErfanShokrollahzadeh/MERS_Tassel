namespace MersTassel.Application.DTOs;

public class CreateSupportTicketRequest
{
    public string Subject { get; set; } = string.Empty;
    public string Category { get; set; } = "other";
    public string Message { get; set; } = string.Empty;
    public string? OrderNumber { get; set; }
}

public class AddSupportTicketMessageRequest
{
    public string Body { get; set; } = string.Empty;
    public bool IsInternal { get; set; }
}

public class UpdateSupportTicketRequest
{
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string? AssignedToUserId { get; set; }
}

public class SupportTicketQuery
{
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public string? Assignment { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 30;
}

public class SupportTicketSummaryDto
{
    public int Id { get; set; }
    public string Number { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string? AssignedToUserId { get; set; }
    public string? AssignedToName { get; set; }
    public string? OrderNumber { get; set; }
    public string Preview { get; set; } = string.Empty;
    public int MessageCount { get; set; }
    public bool IsUnread { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset LastMessageAt { get; set; }
}

public class SupportTicketDetailDto : SupportTicketSummaryDto
{
    public IReadOnlyList<SupportTicketMessageDto> Messages { get; set; } = [];
    public SupportCustomerContextDto? CustomerContext { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public DateTimeOffset? ClosedAt { get; set; }
}

public class SupportTicketMessageDto
{
    public int Id { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public bool IsStaff { get; set; }
    public bool IsInternal { get; set; }
    public string Body { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public IReadOnlyList<SupportTicketAttachmentDto> Attachments { get; set; } = [];
}

public class SupportTicketAttachmentDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
}

public class SupportCustomerContextDto
{
    public int OrderCount { get; set; }
    public decimal LifetimeSpend { get; set; }
    public DateTimeOffset? CustomerSince { get; set; }
    public IReadOnlyList<SupportOrderContextDto> RecentOrders { get; set; } = [];
}

public class SupportOrderContextDto
{
    public string Number { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string Currency { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}

public class SupportAgentDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int OpenTicketCount { get; set; }
}

public record SupportAttachmentDownload(Stream Content, string ContentType, string FileName);

public record StoredSupportAttachment(string StoragePath, string ContentType, long Size);
