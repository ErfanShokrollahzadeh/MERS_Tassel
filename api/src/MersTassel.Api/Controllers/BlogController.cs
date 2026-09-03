using System.Security.Claims;
using FluentValidation;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
namespace MersTassel.Api.Controllers;

[ApiController, Route("api/v1/blog"), Tags("Journal")]
public class BlogController(IBlogService blog, IValidator<CreateBlogCommentDto> commentValidator) : ApiControllerBase
{
    [HttpGet] public async Task<ActionResult<ApiResponse<PagedResult<BlogPostSummaryDto>>>> List([FromQuery]string? tag,[FromQuery]string? search,[FromQuery]int page=1,[FromQuery]int pageSize=9,CancellationToken ct=default)=>Ok(ApiResponse<PagedResult<BlogPostSummaryDto>>.Ok(await blog.GetPublishedPostsAsync(tag,search,page,pageSize,ct)));
    [HttpGet("featured")] public async Task<ActionResult<ApiResponse<IReadOnlyList<BlogPostSummaryDto>>>> Featured(CancellationToken ct)=>Ok(ApiResponse<IReadOnlyList<BlogPostSummaryDto>>.Ok(await blog.GetFeaturedPostsAsync(3,ct)));
    [HttpGet("{slug}")] public async Task<ActionResult<ApiResponse<BlogPostDetailDto>>> Get(string slug,CancellationToken ct)=>Ok(ApiResponse<BlogPostDetailDto>.Ok(await blog.GetPostBySlugAsync(slug,ct)));
    [HttpPost("{slug}/comments")] public async Task<ActionResult<ApiResponse<BlogCommentDto>>> Comment(string slug,[FromBody]CreateBlogCommentDto dto,CancellationToken ct){await ValidateAsync(commentValidator,dto,ct);var result=await blog.AddCommentAsync(slug,dto,User.FindFirstValue(ClaimTypes.NameIdentifier),ct);return StatusCode(201,ApiResponse<BlogCommentDto>.Ok(result,"Thank you! Your comment has been submitted for moderation."));}
}
