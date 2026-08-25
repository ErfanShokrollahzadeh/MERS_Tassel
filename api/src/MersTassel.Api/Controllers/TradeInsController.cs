using FluentValidation;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Api.Controllers.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers;

[ApiController]
[Route("api/v1/trade-ins")]
[Tags("Trade-ins")]
public class TradeInsController(
    ITradeInService tradeIns,
    ICurrentUser currentUser,
    IValidator<TradeInEstimateRequest> estimateValidator,
    IValidator<ApplyTradeInRequest> applyValidator) : ApiControllerBase
{
    [HttpPost("estimate")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<TradeInEstimateDto>>> Estimate(
        TradeInEstimateRequest request,
        CancellationToken ct)
    {
        await ValidateAsync(estimateValidator, request, ct);
        return Ok(ApiResponse<TradeInEstimateDto>.Ok(await tradeIns.EstimateAsync(request, ct)));
    }

    [HttpPost("apply")]
    [Authorize]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(12 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<CartDto>>> Apply(
        [FromForm] ApplyTradeInRequest request,
        [FromForm] IFormFile? image,
        CancellationToken ct)
    {
        await ValidateAsync(applyValidator, request, ct);
        if (image is null || image.Length == 0)
            throw new MersTassel.Application.Common.ValidationException("image", "Add a clear photo of the item you want to trade in.");

        using var upload = FormFileAdapter.Open(image);
        var userId = currentUser.UserId ?? throw new ForbiddenException("Sign in to apply a trade-in credit.");
        return Ok(ApiResponse<CartDto>.Ok(await tradeIns.ApplyAsync(userId, request, upload.Single!, ct),
            "Trade-in estimate applied pending physical verification."));
    }

    [HttpDelete("current")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<CartDto>>> Remove(CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new ForbiddenException("Sign in to manage your trade-in.");
        return Ok(ApiResponse<CartDto>.Ok(await tradeIns.RemoveAsync(userId, ct), "Trade-in removed."));
    }
}
