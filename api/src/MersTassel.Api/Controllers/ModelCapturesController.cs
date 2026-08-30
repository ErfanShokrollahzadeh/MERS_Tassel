using MersTassel.Api.Controllers.Admin;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers;

[ApiController]
[Route("api/v1/model-captures")]
[AllowAnonymous]
[Tags("Secure model capture")]
public class ModelCapturesController(IProductModelGenerationService generation) : ControllerBase
{
    [HttpGet("{jobId:int}")]
    public async Task<ActionResult<ApiResponse<ModelCaptureSessionDto>>> Get(
        int jobId, [FromQuery] string token, CancellationToken ct) =>
        Ok(ApiResponse<ModelCaptureSessionDto>.Ok(await generation.GetCaptureSessionAsync(jobId, token, ct)));

    [HttpPost("{jobId:int}")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(120 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<ModelGenerationJobDto>>> Upload(
        int jobId,
        [FromForm] ModelCaptureUploadRequest request,
        [FromForm] IFormFileCollection images,
        CancellationToken ct)
    {
        using var uploads = FormFileAdapter.Open(images);
        var result = await generation.UploadCaptureAsync(jobId, request, uploads.Files, ct);
        return Ok(ApiResponse<ModelGenerationJobDto>.Ok(result, "Capture uploaded. You can return to the admin workspace."));
    }
}
