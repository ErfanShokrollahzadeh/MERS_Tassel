using FluentValidation;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MersTassel.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/promotions")]
[Authorize(Roles = RoleNames.Admin)]
[Tags("Admin · Promotions")]
public class AdminPromotionsController(
    ICouponService coupons,
    IValidator<CouponWriteRequest> validator) : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CouponDto>>>> List(CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<CouponDto>>.Ok(await coupons.ListAsync(ct)));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<CouponDto>>> Create(
        CouponWriteRequest request,
        CancellationToken ct)
    {
        await ValidateAsync(validator, request, ct);
        var coupon = await coupons.CreateAsync(request, ct);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<CouponDto>.Ok(coupon, "Promotion created."));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<CouponDto>>> Update(
        int id,
        CouponWriteRequest request,
        CancellationToken ct)
    {
        await ValidateAsync(validator, request, ct);
        return Ok(ApiResponse<CouponDto>.Ok(await coupons.UpdateAsync(id, request, ct), "Promotion updated."));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(int id, CancellationToken ct)
    {
        await coupons.DeleteAsync(id, ct);
        return Ok(ApiResponse.Ok("Promotion removed."));
    }
}
