using FluentValidation;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/popups")]
[Authorize(Roles = RoleNames.Admin)]
[Tags("Admin · Popups")]
public class AdminPopupsController(
    IPopupService popups,
    IValidator<PopupWriteRequest> validator) : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminPopupDto>>>> List(CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<AdminPopupDto>>.Ok(await popups.ListAdminAsync(ct)));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<AdminPopupDto>>> Get(int id, CancellationToken ct) =>
        Ok(ApiResponse<AdminPopupDto>.Ok(await popups.GetAdminByIdAsync(id, ct)));

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<AdminPopupDto>>> Create(
        [FromForm] PopupWriteRequest request,
        [FromForm] IFormFile? image,
        CancellationToken ct)
    {
        await ValidateAsync(validator, request, ct);

        using var upload = FormFileAdapter.Open(image);
        var created = await popups.CreateAsync(request, upload.Single, ct);

        return StatusCode(StatusCodes.Status201Created, ApiResponse<AdminPopupDto>.Ok(created, "Popup campaign created."));
    }

    [HttpPut("{id:int}")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<AdminPopupDto>>> Update(
        int id,
        [FromForm] PopupWriteRequest request,
        [FromForm] IFormFile? image,
        CancellationToken ct)
    {
        await ValidateAsync(validator, request, ct);

        using var upload = FormFileAdapter.Open(image);
        var updated = await popups.UpdateAsync(id, request, upload.Single, ct);

        return Ok(ApiResponse<AdminPopupDto>.Ok(updated, "Popup campaign updated."));
    }

    public class StatusUpdateRequest
    {
        public bool IsActive { get; set; }
    }

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<ApiResponse<object?>>> ToggleStatus(
        int id,
        [FromBody] StatusUpdateRequest request,
        CancellationToken ct)
    {
        await popups.ToggleStatusAsync(id, request.IsActive, ct);
        return Ok(ApiResponse.Ok($"Popup campaign {(request.IsActive ? "activated" : "paused")}."));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(int id, CancellationToken ct)
    {
        await popups.DeleteAsync(id, ct);
        return Ok(ApiResponse.Ok("Popup campaign removed."));
    }
}
