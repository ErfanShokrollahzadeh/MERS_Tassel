using FluentValidation;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers;

[ApiController]
[Route("api/v1/exchanges")]
[Authorize]
[Tags("Product exchanges")]
public class ExchangesController(
    IExchangeService exchanges,
    ICurrentUser currentUser,
    IValidator<CreateExchangeRequest> validator) : ApiControllerBase
{
    private string UserId => currentUser.UserId ?? throw new ForbiddenException("Sign in to manage exchanges.");

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ExchangeRequestDto>>>> Mine(CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<ExchangeRequestDto>>.Ok(await exchanges.ListForUserAsync(UserId, ct)));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ExchangeRequestDto>>> Create(
        CreateExchangeRequest request,
        CancellationToken ct)
    {
        await ValidateAsync(validator, request, ct);
        var exchange = await exchanges.CreateAsync(UserId, request, ct);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<ExchangeRequestDto>.Ok(exchange, "Exchange request submitted pending invoice and packaging verification."));
    }

    [HttpPost("{id:int}/checkout")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> CheckoutDifference(
        int id,
        ExchangeCheckoutRequest request,
        CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, ApiResponse<OrderDto>.Ok(
            await exchanges.CreateSettlementOrderAsync(UserId, id, request, ct),
            "Exchange settlement order created."));
}
