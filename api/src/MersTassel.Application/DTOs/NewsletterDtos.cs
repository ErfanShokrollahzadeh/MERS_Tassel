namespace MersTassel.Application.DTOs;

public class NewsletterSubscribeRequest
{
    public string Email { get; set; } = string.Empty;
    public string Locale { get; set; } = "en";
    public string Source { get; set; } = "home";
}

public class NewsletterSubscriptionDto
{
    public string Email { get; set; } = string.Empty;
    public bool AlreadySubscribed { get; set; }
    public DateTimeOffset SubscribedAt { get; set; }
}
