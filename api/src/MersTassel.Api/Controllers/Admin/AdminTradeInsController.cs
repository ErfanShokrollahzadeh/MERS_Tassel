using FluentValidation;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/trade-ins")]
[Authorize(Roles = RoleNames.Admin)]
[Tags("Admin · Trade-ins")]
public class AdminTradeInsController(
    ITradeInService tradeIns,
    IValidator<UpdateTradeInStatusRequest> validator) : ApiControllerBase
{
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<ApiResponse<TradeInDto>>> UpdateStatus(
        int id,
        UpdateTradeInStatusRequest request,
        CancellationToken ct)
    {
        await ValidateAsync(validator, request, ct);
        return Ok(ApiResponse<TradeInDto>.Ok(await tradeIns.UpdateStatusAsync(id, request, ct), "Trade-in updated."));
    }
}
