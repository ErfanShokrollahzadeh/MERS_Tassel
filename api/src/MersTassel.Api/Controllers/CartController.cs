using FluentValidation;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers;

[ApiController]
[Route("api/v1/cart")]
[Authorize]
[Tags("Cart")]
public class CartController(
    ICartService cart,
    ICurrentUser currentUser,
    IValidator<AddCartItemRequest> addValidator,
    IValidator<AddGiftBoxRequest> giftBoxValidator,
    IValidator<AddSurpriseBoxRequest> surpriseBoxValidator,
    IValidator<UpdateCartItemRequest> updateValidator) : ApiControllerBase
{
    private string UserId => currentUser.UserId ?? throw new ForbiddenException("Sign in to use your bag.");

    [HttpGet]
    public async Task<ActionResult<ApiResponse<CartDto>>> Get(CancellationToken ct) =>
        Ok(ApiResponse<CartDto>.Ok(await cart.GetAsync(UserId, ct)));

    [HttpPost("items")]
    public async Task<ActionResult<ApiResponse<CartDto>>> AddItem(AddCartItemRequest request, CancellationToken ct)
    {
        await ValidateAsync(addValidator, request, ct);
        return Ok(ApiResponse<CartDto>.Ok(await cart.AddItemAsync(UserId, request, ct)));
    }

    [HttpPost("gift-boxes")]
    public async Task<ActionResult<ApiResponse<CartDto>>> AddGiftBox(AddGiftBoxRequest request, CancellationToken ct)
    {
        await ValidateAsync(giftBoxValidator, request, ct);
        return Ok(ApiResponse<CartDto>.Ok(await cart.AddGiftBoxAsync(UserId, request, ct)));
    }

    [HttpPost("surprise-boxes")]
    public async Task<ActionResult<ApiResponse<CartDto>>> AddSurpriseBox(AddSurpriseBoxRequest request, CancellationToken ct)
    {
        await ValidateAsync(surpriseBoxValidator, request, ct);
        return Ok(ApiResponse<CartDto>.Ok(await cart.AddSurpriseBoxAsync(UserId, request, ct)));
    }

    [HttpPatch("items/{itemId:int}")]
    public async Task<ActionResult<ApiResponse<CartDto>>> UpdateItem(int itemId, UpdateCartItemRequest request, CancellationToken ct)
    {
        await ValidateAsync(updateValidator, request, ct);
        return Ok(ApiResponse<CartDto>.Ok(await cart.UpdateItemAsync(UserId, itemId, request.Quantity, ct)));
    }

    [HttpDelete("items/{itemId:int}")]
    public async Task<ActionResult<ApiResponse<CartDto>>> RemoveItem(int itemId, CancellationToken ct) =>
        Ok(ApiResponse<CartDto>.Ok(await cart.RemoveItemAsync(UserId, itemId, ct)));

    [HttpDelete]
    public async Task<ActionResult<ApiResponse<object?>>> Clear(CancellationToken ct)
    {
        await cart.ClearAsync(UserId, ct);
        return Ok(ApiResponse.Ok("Bag emptied."));
    }
}
