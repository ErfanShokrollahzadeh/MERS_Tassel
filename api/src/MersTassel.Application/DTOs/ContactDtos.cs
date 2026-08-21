namespace MersTassel.Application.DTOs;

public class ContactMessageRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Topic { get; set; } = "product";
    public string Message { get; set; } = string.Empty;
    public string Locale { get; set; } = "en";
}

public class ContactMessageReceiptDto
{
    public int Reference { get; set; }
    public DateTimeOffset ReceivedAt { get; set; }
}
