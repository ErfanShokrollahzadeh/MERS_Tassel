using FluentValidation;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers;

[ApiController]
[Route("api/v1/coupons")]
[Authorize]
[Tags("Coupons")]
public class CouponsController(
    ICouponService coupons,
    ICurrentUser currentUser,
    IValidator<ValidateCouponRequest> validator) : ApiControllerBase
{
    private string UserId => currentUser.UserId ?? throw new ForbiddenException("Sign in to use a coupon.");

    /// <summary>
    /// Validates and attaches a promotion to the caller's open cart. The supplied subtotal is
    /// informational; eligibility and savings are calculated from persisted cart lines.
    /// </summary>
    [HttpPost("validate")]
    public async Task<ActionResult<ApiResponse<CartDto>>> Validate(
        ValidateCouponRequest request,
        CancellationToken ct)
    {
        await ValidateAsync(validator, request, ct);
        return Ok(ApiResponse<CartDto>.Ok(await coupons.ValidateAsync(UserId, request, ct), "Coupon applied."));
    }

    [HttpDelete("current")]
    public async Task<ActionResult<ApiResponse<CartDto>>> Remove(CancellationToken ct) =>
        Ok(ApiResponse<CartDto>.Ok(await coupons.RemoveAsync(UserId, ct), "Coupon removed."));
}
