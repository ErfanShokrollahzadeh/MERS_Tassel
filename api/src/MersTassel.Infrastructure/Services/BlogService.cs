using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MersTassel.Infrastructure.Services;

public class BlogService(AppDbContext db, IFileStorageService storage) : IBlogService
{
    public async Task<PagedResult<BlogPostSummaryDto>> GetPublishedPostsAsync(string? tag, string? search, int page, int pageSize, CancellationToken ct = default)
    {
        page = Math.Max(page, 1); pageSize = Math.Clamp(pageSize, 1, 50);
        var q = db.BlogPosts.AsNoTracking().Where(x => x.IsPublished && x.PublishedAt <= DateTimeOffset.UtcNow);
        if (!string.IsNullOrWhiteSpace(tag)) q = q.Where(x => x.Category == tag || (x.Tags != null && x.Tags.Contains(tag)));
        if (!string.IsNullOrWhiteSpace(search)) q = q.Where(x => x.Title.Contains(search) || (x.TitleTr != null && x.TitleTr.Contains(search)) || x.Excerpt.Contains(search));
        var total = await q.CountAsync(ct);
        var rows = await q.OrderByDescending(x => x.PublishedAt).Skip((page - 1) * pageSize).Take(pageSize).Select(SummaryProjection()).ToListAsync(ct);
        return new(rows, page, pageSize, total);
    }
    public async Task<IReadOnlyList<BlogPostSummaryDto>> GetFeaturedPostsAsync(int count, CancellationToken ct = default) => await db.BlogPosts.AsNoTracking().Where(x => x.IsPublished && x.PublishedAt <= DateTimeOffset.UtcNow).OrderByDescending(x => x.PublishedAt).Take(Math.Clamp(count, 1, 12)).Select(SummaryProjection()).ToListAsync(ct);
    public async Task<BlogPostDetailDto> GetPostBySlugAsync(string slug, CancellationToken ct = default) { var p = await db.BlogPosts.AsNoTracking().Include(x => x.Comments.Where(c => c.Status == BlogCommentStatus.Approved)).FirstOrDefaultAsync(x => x.Slug == slug && x.IsPublished && x.PublishedAt <= DateTimeOffset.UtcNow, ct) ?? throw new NotFoundException("Journal story not found."); return Detail(p, true); }
    public async Task<BlogCommentDto> AddCommentAsync(string slug, CreateBlogCommentDto dto, string? customerId, CancellationToken ct = default) { var post = await db.BlogPosts.FirstOrDefaultAsync(x => x.Slug == slug && x.IsPublished, ct) ?? throw new NotFoundException("Journal story not found."); var c = new BlogComment { Post = post, AuthorName = dto.AuthorName.Trim(), AuthorEmail = dto.AuthorEmail.Trim(), Content = dto.Content.Trim(), CustomerId = customerId, Status = BlogCommentStatus.Pending }; db.BlogComments.Add(c); await db.SaveChangesAsync(ct); return Comment(c, post.Title); }
    public async Task<IReadOnlyList<BlogPostSummaryDto>> GetAdminPostsAsync(CancellationToken ct = default) => await db.BlogPosts.AsNoTracking().OrderByDescending(x => x.PublishedAt).Select(SummaryProjection()).ToListAsync(ct);
    public async Task<BlogPostDetailDto> GetPostByIdAsync(int id, CancellationToken ct = default) { var p = await db.BlogPosts.AsNoTracking().Include(x => x.Comments).FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Journal story not found."); return Detail(p, false); }
    public async Task<BlogPostDetailDto> CreatePostAsync(CreateBlogPostDto dto, UploadedFile? cover, CancellationToken ct = default) { await EnsureSlug(dto.Slug, null, ct); var p = new BlogPost(); Apply(p, dto); if (cover != null) p.CoverImagePath = await storage.SaveAsync(cover.Content, cover.FileName, "blog", ct); db.BlogPosts.Add(p); await db.SaveChangesAsync(ct); return Detail(p, false); }
    public async Task<BlogPostDetailDto> UpdatePostAsync(int id, UpdateBlogPostDto dto, UploadedFile? cover, CancellationToken ct = default) { var p = await db.BlogPosts.Include(x => x.Comments).FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Journal story not found."); await EnsureSlug(dto.Slug, id, ct); var old = p.CoverImagePath; Apply(p, dto); if (cover != null) p.CoverImagePath = await storage.SaveAsync(cover.Content, cover.FileName, "blog", ct); else if (dto.RemoveCoverImage) p.CoverImagePath = null; await db.SaveChangesAsync(ct); if (old != p.CoverImagePath) await storage.DeleteAsync(old, ct); return Detail(p, false); }
    public async Task DeletePostAsync(int id, CancellationToken ct = default) { var p = await db.BlogPosts.FindAsync([id], ct) ?? throw new NotFoundException("Journal story not found."); p.IsDelete = true; p.DeletedAt = DateTimeOffset.UtcNow; await db.SaveChangesAsync(ct); }
    public async Task<IReadOnlyList<BlogCommentDto>> GetAdminCommentsAsync(BlogCommentStatus? status, CancellationToken ct = default) { var q = db.BlogComments.AsNoTracking().Include(x => x.Post).AsQueryable(); if (status.HasValue) q = q.Where(x => x.Status == status); return await q.OrderByDescending(x => x.CreatedAt).Select(x => new BlogCommentDto(x.Id,x.PostId,x.Post.Title,x.AuthorName,x.Content,x.Status,x.CreatedAt)).ToListAsync(ct); }
    public async Task<BlogCommentDto> ModerateCommentAsync(int id, BlogCommentStatus status, CancellationToken ct = default) { var c = await db.BlogComments.Include(x => x.Post).FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Comment not found."); c.Status = status; await db.SaveChangesAsync(ct); return Comment(c,c.Post.Title); }
    public async Task DeleteCommentAsync(int id, CancellationToken ct = default) { var c = await db.BlogComments.FindAsync([id], ct) ?? throw new NotFoundException("Comment not found."); db.Remove(c); await db.SaveChangesAsync(ct); }
    private async Task EnsureSlug(string slug,int? id,CancellationToken ct) { if(await db.BlogPosts.AnyAsync(x=>x.Slug==slug && x.Id!=id,ct)) throw new ConflictException("That journal slug is already in use."); }
    private static void Apply(BlogPost p, CreateBlogPostDto d) { p.Title=d.Title.Trim();p.TitleTr=d.TitleTr?.Trim();p.Slug=d.Slug.Trim().ToLowerInvariant();p.Excerpt=d.Excerpt.Trim();p.ExcerptTr=d.ExcerptTr?.Trim();p.Content=d.Content.Trim();p.ContentTr=d.ContentTr?.Trim();p.AuthorName=d.AuthorName.Trim();p.Category=d.Category.Trim();p.Tags=d.Tags?.Trim();p.ReadingTimeMinutes=d.ReadingTimeMinutes;p.IsPublished=d.IsPublished;p.PublishedAt=d.PublishedAt??DateTimeOffset.UtcNow; }
    private static System.Linq.Expressions.Expression<Func<BlogPost,BlogPostSummaryDto>> SummaryProjection()=>x=>new(x.Id,x.Title,x.TitleTr,x.Slug,x.Excerpt,x.ExcerptTr,x.CoverImagePath,x.AuthorName,x.Category,x.Tags,x.ReadingTimeMinutes,x.IsPublished,x.PublishedAt,x.Comments.Count(c=>c.Status==BlogCommentStatus.Approved));
    private static BlogPostDetailDto Detail(BlogPost x,bool approved)=>new(x.Id,x.Title,x.TitleTr,x.Slug,x.Excerpt,x.ExcerptTr,x.Content,x.ContentTr,x.CoverImagePath,x.AuthorName,x.AuthorAvatarPath,x.Category,x.Tags,x.ReadingTimeMinutes,x.IsPublished,x.PublishedAt,x.Comments.Where(c=>!approved||c.Status==BlogCommentStatus.Approved).OrderByDescending(c=>c.CreatedAt).Select(c=>Comment(c,x.Title)).ToList());
    private static BlogCommentDto Comment(BlogComment c,string title)=>new(c.Id,c.PostId,title,c.AuthorName,c.Content,c.Status,c.CreatedAt);
}
