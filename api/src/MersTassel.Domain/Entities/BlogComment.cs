using MersTassel.Domain.Common;

namespace MersTassel.Domain.Entities;

public enum BlogCommentStatus { Pending = 0, Approved = 1, Rejected = 2 }

public class BlogComment : BaseEntity
{
    public int PostId { get; set; }
    public BlogPost Post { get; set; } = null!;
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorEmail { get; set; } = string.Empty;
    public string? CustomerId { get; set; }
    public AppUser? Customer { get; set; }
    public string Content { get; set; } = string.Empty;
    public BlogCommentStatus Status { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
