using MersTassel.Domain.Common;

namespace MersTassel.Domain.Entities;

public class NewsletterSubscriber : SoftDeletableEntity
{
    public string Email { get; set; } = string.Empty;
    public string NormalizedEmail { get; set; } = string.Empty;
    public string Locale { get; set; } = "en";
    public string Source { get; set; } = "home";
}
