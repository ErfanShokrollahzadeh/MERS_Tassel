using FluentValidation;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers.Admin;
[ApiController, Route("api/v1/admin/blog"), Authorize(Roles=RoleNames.Admin), Tags("Admin · Journal")]
public class AdminBlogController(IBlogService blog,IValidator<CreateBlogPostDto> createValidator,IValidator<UpdateBlogPostDto> updateValidator):ApiControllerBase
{
 [HttpGet] public async Task<ActionResult<ApiResponse<IReadOnlyList<BlogPostSummaryDto>>>> List(CancellationToken ct)=>Ok(ApiResponse<IReadOnlyList<BlogPostSummaryDto>>.Ok(await blog.GetAdminPostsAsync(ct)));
 [HttpGet("{id:int}")] public async Task<ActionResult<ApiResponse<BlogPostDetailDto>>> Get(int id,CancellationToken ct)=>Ok(ApiResponse<BlogPostDetailDto>.Ok(await blog.GetPostByIdAsync(id,ct)));
 [HttpPost,Consumes("multipart/form-data")] public async Task<ActionResult<ApiResponse<BlogPostDetailDto>>> Create([FromForm]CreateBlogPostDto dto,[FromForm]IFormFile? coverImage,CancellationToken ct){await ValidateAsync(createValidator,dto,ct);using var f=FormFileAdapter.Open(coverImage);return StatusCode(201,ApiResponse<BlogPostDetailDto>.Ok(await blog.CreatePostAsync(dto,f.Single,ct)));}
 [HttpPut("{id:int}"),Consumes("multipart/form-data")] public async Task<ActionResult<ApiResponse<BlogPostDetailDto>>> Update(int id,[FromForm]UpdateBlogPostDto dto,[FromForm]IFormFile? coverImage,CancellationToken ct){await ValidateAsync(updateValidator,dto,ct);using var f=FormFileAdapter.Open(coverImage);return Ok(ApiResponse<BlogPostDetailDto>.Ok(await blog.UpdatePostAsync(id,dto,f.Single,ct)));}
 [HttpDelete("{id:int}")] public async Task<ActionResult<ApiResponse<object?>>> Delete(int id,CancellationToken ct){await blog.DeletePostAsync(id,ct);return Ok(ApiResponse.Ok("Story deleted."));}
 [HttpGet("comments")] public async Task<ActionResult<ApiResponse<IReadOnlyList<BlogCommentDto>>>> Comments([FromQuery]BlogCommentStatus? status,CancellationToken ct)=>Ok(ApiResponse<IReadOnlyList<BlogCommentDto>>.Ok(await blog.GetAdminCommentsAsync(status,ct)));
 [HttpPatch("comments/{id:int}")] public async Task<ActionResult<ApiResponse<BlogCommentDto>>> Moderate(int id,[FromBody]ModerateCommentDto dto,CancellationToken ct)=>Ok(ApiResponse<BlogCommentDto>.Ok(await blog.ModerateCommentAsync(id,dto.Status,ct)));
 [HttpDelete("comments/{id:int}")] public async Task<ActionResult<ApiResponse<object?>>> DeleteComment(int id,CancellationToken ct){await blog.DeleteCommentAsync(id,ct);return Ok(ApiResponse.Ok("Comment deleted."));}
}
