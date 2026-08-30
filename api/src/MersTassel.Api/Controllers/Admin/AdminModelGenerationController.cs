using MersTassel.Api.Controllers.Admin;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers.Admin;

[ApiController]
[Authorize(Roles = RoleNames.Admin)]
[Tags("Admin · 3D generation")]
public class AdminModelGenerationController(
    IProductModelGenerationService generation,
    ICurrentUser currentUser) : ApiControllerBase
{
    [HttpPost("api/v1/admin/products/{productId:int}/model-generation-jobs")]
    public async Task<ActionResult<ApiResponse<CreateModelGenerationJobResult>>> Create(
        int productId, CreateModelGenerationJobRequest request, CancellationToken ct)
    {
        var result = await generation.CreateAsync(productId, currentUser.UserId!, request, ct);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<CreateModelGenerationJobResult>.Ok(result,
            "Secure phone capture created. The link expires in 20 minutes."));
    }

    [HttpGet("api/v1/admin/products/{productId:int}/model-generation-jobs")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ModelGenerationJobDto>>>> List(int productId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<ModelGenerationJobDto>>.Ok(await generation.ListAsync(productId, ct)));

    [HttpGet("api/v1/admin/model-generation-jobs/{jobId:int}")]
    public async Task<ActionResult<ApiResponse<ModelGenerationJobDto>>> Get(int jobId, CancellationToken ct) =>
        Ok(ApiResponse<ModelGenerationJobDto>.Ok(await generation.GetAsync(jobId, ct)));

    [HttpPost("api/v1/admin/model-generation-jobs/{jobId:int}/retry")]
    public async Task<ActionResult<ApiResponse<ModelGenerationJobDto>>> Retry(int jobId, CancellationToken ct) =>
        Ok(ApiResponse<ModelGenerationJobDto>.Ok(await generation.RetryAsync(jobId, ct), "Generation retry queued."));

    [HttpPost("api/v1/admin/model-generation-jobs/{jobId:int}/cancel")]
    public async Task<ActionResult<ApiResponse<ModelGenerationJobDto>>> Cancel(int jobId, CancellationToken ct) =>
        Ok(ApiResponse<ModelGenerationJobDto>.Ok(await generation.CancelAsync(jobId, ct), "Generation cancelled."));

    [HttpPost("api/v1/admin/model-generation-jobs/{jobId:int}/approve")]
    public async Task<ActionResult<ApiResponse<ModelGenerationJobDto>>> Approve(int jobId, ModelGenerationReviewRequest request, CancellationToken ct) =>
        Ok(ApiResponse<ModelGenerationJobDto>.Ok(await generation.ApproveAsync(jobId, currentUser.UserId!, request, ct), "3D model approved and published."));

    [HttpPost("api/v1/admin/model-generation-jobs/{jobId:int}/reject")]
    public async Task<ActionResult<ApiResponse<ModelGenerationJobDto>>> Reject(int jobId, ModelGenerationRejectRequest request, CancellationToken ct) =>
        Ok(ApiResponse<ModelGenerationJobDto>.Ok(await generation.RejectAsync(jobId, currentUser.UserId!, request, ct), "Draft rejected."));
}
