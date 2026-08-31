<<<<<<< ours
using FluentValidation;
=======
>>>>>>> theirs
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers;
<<<<<<< ours

[ApiController]
[Route("api/v1/popups")]
[Tags("Storefront · Popups")]
public class PopupsController(
    IPopupService popups,
    IValidator<TrackPopupEventRequest> trackValidator) : ApiControllerBase
{
    /// <summary>
    /// Returns active popup and modal campaigns configured for the given path and client device.
    /// </summary>
    [HttpGet("active")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PopupDto>>>> GetActive(
        [FromQuery] string? path,
        [FromQuery] string? device,
        CancellationToken ct)
    {
        var isAuthenticated = User.Identity?.IsAuthenticated == true;
        var active = await popups.GetActivePopupsAsync(path, device, isAuthenticated, ct);
        return Ok(ApiResponse<IReadOnlyList<PopupDto>>.Ok(active));
    }

    /// <summary>
    /// Records impression, click, or conversion telemetry for a popup campaign.
    /// </summary>
    [HttpPost("{id:int}/track")]
    public async Task<ActionResult<ApiResponse<object?>>> Track(
        int id,
        [FromBody] TrackPopupEventRequest request,
        CancellationToken ct)
    {
        await ValidateAsync(trackValidator, request, ct);
        await popups.RecordEventAsync(id, request.EventType, ct);
        return Ok(ApiResponse.Ok());
    }
=======
[ApiController, Route("api/v1/popups"), Tags("Popups")]
public class PopupsController(IPopupService service) : ControllerBase
{
    [HttpGet("active")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PopupDto>>>> Active([FromQuery] string? path, [FromQuery] string? device, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<PopupDto>>.Ok(await service.GetActivePopupsAsync(path, device, User.Identity?.IsAuthenticated == true, ct)));
    [HttpPost("{id:int}/track")]
    public async Task<ActionResult<ApiResponse<object?>>> Track(int id, TrackPopupEventRequest request, CancellationToken ct) { await service.RecordEventAsync(id, request.EventType, ct); return Ok(ApiResponse.Ok()); }
>>>>>>> theirs
}
