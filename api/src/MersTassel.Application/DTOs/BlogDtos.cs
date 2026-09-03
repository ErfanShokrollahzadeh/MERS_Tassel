using MersTassel.Domain.Entities;

namespace MersTassel.Application.DTOs;

public record BlogPostSummaryDto(int Id, string Title, string? TitleTr, string Slug, string Excerpt, string? ExcerptTr, string? CoverImagePath, string Category, string? Tags, int ReadingTimeMinutes, DateTimeOffset PublishedAt, int CommentsCount);
public record BlogPostDetailDto(int Id, string Title, string? TitleTr, string Slug, string Excerpt, string? ExcerptTr, string Content, string? ContentTr, string? CoverImagePath, string AuthorName, string? AuthorAvatarPath, string Category, string? Tags, int ReadingTimeMinutes, bool IsPublished, DateTimeOffset PublishedAt, IReadOnlyList<BlogCommentDto> Comments);
public record CreateBlogPostDto(string Title, string? TitleTr, string Slug, string Excerpt, string? ExcerptTr, string Content, string? ContentTr, string? CoverImagePath, string AuthorName, string? AuthorAvatarPath, string Category, string? Tags, int ReadingTimeMinutes = 3, bool IsPublished = true, DateTimeOffset? PublishedAt = null);
public record UpdateBlogPostDto(string Title, string? TitleTr, string Slug, string Excerpt, string? ExcerptTr, string Content, string? ContentTr, string? CoverImagePath, string AuthorName, string? AuthorAvatarPath, string Category, string? Tags, int ReadingTimeMinutes, bool IsPublished, DateTimeOffset PublishedAt);
public record BlogCommentDto(int Id, int PostId, string PostTitle, string AuthorName, string Content, BlogCommentStatus Status, DateTimeOffset CreatedAt);
public record CreateBlogCommentDto(string AuthorName, string AuthorEmail, string Content);
public record ModerateCommentDto(BlogCommentStatus Status);
