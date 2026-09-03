using MersTassel.Domain.Common;

namespace MersTassel.Domain.Entities;

public class BlogPost : SoftDeletableEntity
{
    public string Title { get; set; } = string.Empty;
    public string? TitleTr { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public string? ExcerptTr { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? ContentTr { get; set; }
    public string? CoverImagePath { get; set; }
    public string AuthorName { get; set; } = "MERS Atelier";
    public string? AuthorAvatarPath { get; set; }
    public string Category { get; set; } = "Atelier";
    public string? Tags { get; set; }
    public int ReadingTimeMinutes { get; set; } = 3;
    public bool IsPublished { get; set; } = true;
    public DateTimeOffset PublishedAt { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<BlogComment> Comments { get; set; } = new List<BlogComment>();
}
