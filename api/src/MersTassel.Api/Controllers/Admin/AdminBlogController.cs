using FluentValidation;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers.Admin;

[ApiController, Route("api/v1/admin/blog"), Authorize(Roles=RoleNames.Admin), Tags("Admin · Journal")]
public class AdminBlogController(
    IBlogService blog,
    IFileStorageService files,
    IValidator<CreateBlogPostDto> createValidator,
    IValidator<UpdateBlogPostDto> updateValidator,
    IValidator<ModerateCommentDto> moderateValidator) : ApiControllerBase
{
    [HttpGet] public async Task<ActionResult<ApiResponse<IReadOnlyList<BlogPostDetailDto>>>> List(CancellationToken ct)=>Ok(ApiResponse<IReadOnlyList<BlogPostDetailDto>>.Ok(await blog.GetAdminPostsAsync(ct)));
    [HttpGet("{id:int}")] public async Task<ActionResult<ApiResponse<BlogPostDetailDto>>> Get(int id,CancellationToken ct)=>Ok(ApiResponse<BlogPostDetailDto>.Ok(await blog.GetPostByIdAsync(id,ct)));
    [HttpPost] public async Task<ActionResult<ApiResponse<BlogPostDetailDto>>> Create(CreateBlogPostDto dto,CancellationToken ct){await ValidateAsync(createValidator,dto,ct);var p=await blog.CreatePostAsync(dto,ct);return CreatedAtAction(nameof(Get),new{id=p.Id},ApiResponse<BlogPostDetailDto>.Ok(p));}
    [HttpPut("{id:int}")] public async Task<ActionResult<ApiResponse<BlogPostDetailDto>>> Update(int id,UpdateBlogPostDto dto,CancellationToken ct){await ValidateAsync(updateValidator,dto,ct);return Ok(ApiResponse<BlogPostDetailDto>.Ok(await blog.UpdatePostAsync(id,dto,ct)));}
    [HttpDelete("{id:int}")] public async Task<ActionResult> Delete(int id,CancellationToken ct){await blog.DeletePostAsync(id,ct);return NoContent();}
    [HttpPost("cover")]
    public async Task<ActionResult<ApiResponse<string>>> Cover(IFormFile cover,CancellationToken ct)
    {
        await using var stream=cover.OpenReadStream();
        files.Validate(stream,cover.FileName,cover.Length);
        return Ok(ApiResponse<string>.Ok(await files.SaveAsync(stream,cover.FileName,"blog",ct)));
    }
    [HttpGet("comments/all")] public async Task<ActionResult<ApiResponse<IReadOnlyList<BlogCommentDto>>>> Comments(BlogCommentStatus? status,CancellationToken ct)=>Ok(ApiResponse<IReadOnlyList<BlogCommentDto>>.Ok(await blog.GetAdminCommentsAsync(status,ct)));
    [HttpPatch("comments/{id:int}")]
    public async Task<ActionResult<ApiResponse<BlogCommentDto>>> Moderate(int id,ModerateCommentDto dto,CancellationToken ct)
    {
        await ValidateAsync(moderateValidator,dto,ct);
        return Ok(ApiResponse<BlogCommentDto>.Ok(await blog.ModerateCommentAsync(id,dto.Status,ct)));
    }
    [HttpDelete("comments/{id:int}")] public async Task<ActionResult> DeleteComment(int id,CancellationToken ct){await blog.DeleteCommentAsync(id,ct);return NoContent();}
}
