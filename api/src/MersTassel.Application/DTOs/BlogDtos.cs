using MersTassel.Domain.Entities;

namespace MersTassel.Application.DTOs;

public record BlogPostSummaryDto(int Id, string Title, string? TitleTr, string Slug, string Excerpt, string? ExcerptTr, string? CoverImagePath, string AuthorName, string Category, string? Tags, int ReadingTimeMinutes, bool IsPublished, DateTimeOffset PublishedAt, int CommentsCount);
public record BlogPostDetailDto(int Id, string Title, string? TitleTr, string Slug, string Excerpt, string? ExcerptTr, string Content, string? ContentTr, string? CoverImagePath, string AuthorName, string? AuthorAvatarPath, string Category, string? Tags, int ReadingTimeMinutes, bool IsPublished, DateTimeOffset PublishedAt, IReadOnlyList<BlogCommentDto> Comments);
public class CreateBlogPostDto { public string Title { get; set; } = ""; public string? TitleTr { get; set; } public string Slug { get; set; } = ""; public string Excerpt { get; set; } = ""; public string? ExcerptTr { get; set; } public string Content { get; set; } = ""; public string? ContentTr { get; set; } public string AuthorName { get; set; } = "MERS Atelier"; public string Category { get; set; } = "Atelier"; public string? Tags { get; set; } public int ReadingTimeMinutes { get; set; } = 3; public bool IsPublished { get; set; } = true; public DateTimeOffset? PublishedAt { get; set; } }
public class UpdateBlogPostDto : CreateBlogPostDto { public bool RemoveCoverImage { get; set; } }
public record BlogCommentDto(int Id, int PostId, string PostTitle, string AuthorName, string Content, BlogCommentStatus Status, DateTimeOffset CreatedAt);
public class CreateBlogCommentDto { public string AuthorName { get; set; } = ""; public string AuthorEmail { get; set; } = ""; public string Content { get; set; } = ""; }
public class ModerateCommentDto { public BlogCommentStatus Status { get; set; } }
