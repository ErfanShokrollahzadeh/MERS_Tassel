using System.Security.Claims;
using FluentValidation;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MersTassel.Api.Controllers;

[ApiController, Route("api/v1/blog"), Tags("Journal")]
public class BlogController(IBlogService blog, IValidator<CreateBlogCommentDto> validator) : ApiControllerBase
{
    [HttpGet] public async Task<ActionResult<ApiResponse<PagedResult<BlogPostSummaryDto>>>> List(string? tag,string? search,int page=1,int pageSize=9,CancellationToken ct=default) => Ok(ApiResponse<PagedResult<BlogPostSummaryDto>>.Ok(await blog.GetPublishedPostsAsync(tag,search,page,pageSize,ct)));
    [HttpGet("featured")] public async Task<ActionResult<ApiResponse<IReadOnlyList<BlogPostSummaryDto>>>> Featured(CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<BlogPostSummaryDto>>.Ok(await blog.GetFeaturedPostsAsync(3,ct)));
    [HttpGet("{slug}")] public async Task<ActionResult<ApiResponse<BlogPostDetailDto>>> Detail(string slug,CancellationToken ct) => Ok(ApiResponse<BlogPostDetailDto>.Ok(await blog.GetPostBySlugAsync(slug,ct)));
    [HttpPost("{slug}/comments")]
    [EnableRateLimiting("blog-comments")]
    public async Task<ActionResult<ApiResponse<BlogCommentDto>>> Comment(string slug,CreateBlogCommentDto dto,CancellationToken ct)
    {
        await ValidateAsync(validator,dto,ct);
        var result=await blog.AddCommentAsync(slug,dto,User.FindFirstValue(ClaimTypes.NameIdentifier),ct);
        return StatusCode(201,ApiResponse<BlogCommentDto>.Ok(result,"Comment submitted for moderation."));
    }
}
