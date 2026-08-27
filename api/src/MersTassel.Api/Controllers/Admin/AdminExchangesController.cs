using FluentValidation;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/exchanges")]
[Authorize(Roles = RoleNames.Admin)]
[Tags("Admin · Exchanges")]
public class AdminExchangesController(
    IExchangeService exchanges,
    IValidator<UpdateExchangeStatusRequest> validator) : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ExchangeRequestDto>>>> List(CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<ExchangeRequestDto>>.Ok(await exchanges.ListAllAsync(ct)));

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<ApiResponse<ExchangeRequestDto>>> UpdateStatus(
        int id,
        UpdateExchangeStatusRequest request,
        CancellationToken ct)
    {
        await ValidateAsync(validator, request, ct);
        return Ok(ApiResponse<ExchangeRequestDto>.Ok(
            await exchanges.UpdateStatusAsync(id, request, ct),
            "Exchange updated and any approved store credit posted."));
    }
}
