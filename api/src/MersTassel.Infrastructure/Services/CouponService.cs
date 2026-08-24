using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Domain.Enums;
using MersTassel.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MersTassel.Infrastructure.Services;

public class CouponService(AppDbContext db) : ICouponService
{
    public async Task<CartDto> ValidateAsync(
        string userId,
        ValidateCouponRequest request,
        CancellationToken ct = default)
    {
        var cart = await LoadCartAsync(userId, ct)
            ?? throw new CouponException("empty_cart", "Add something to your bag before applying a coupon.");
        var subtotal = CartService.CalculateSubtotal(cart);
        if (subtotal <= 0)
            throw new CouponException("empty_cart", "Add something to your bag before applying a coupon.");

        var normalized = Normalize(request.Code);
        var coupon = await db.Coupons
            .FirstOrDefaultAsync(entry => entry.NormalizedCode == normalized, ct)
            ?? throw new CouponException("invalid_coupon", "Invalid code.");

        _ = CouponPricing.Evaluate(coupon, subtotal, cart.Currency);
        cart.CouponId = coupon.Id;
        cart.Coupon = coupon;
        await db.SaveChangesAsync(ct);

        return CartService.ToDto(cart);
    }

    public async Task<CartDto> RemoveAsync(string userId, CancellationToken ct = default)
    {
        var cart = await LoadCartAsync(userId, ct);
        if (cart is null) return CartService.Empty();

        cart.CouponId = null;
        cart.Coupon = null;
        await db.SaveChangesAsync(ct);
        return CartService.ToDto(cart);
    }

    public async Task<IReadOnlyList<CouponDto>> ListAsync(CancellationToken ct = default)
    {
        var coupons = await db.Coupons
            .AsNoTracking()
            .OrderByDescending(entry => entry.CreatedAt)
            .ToListAsync(ct);
        return coupons.Select(ToDto).ToList();
    }

    public async Task<CouponDto> CreateAsync(CouponWriteRequest request, CancellationToken ct = default)
    {
        var normalized = Normalize(request.Code);
        if (await db.Coupons.IgnoreQueryFilters().AnyAsync(entry => entry.NormalizedCode == normalized, ct))
            throw new ConflictException("A promotion with this code already exists.");

        var coupon = new Coupon();
        Apply(coupon, request, normalized);
        db.Coupons.Add(coupon);
        await db.SaveChangesAsync(ct);
        return ToDto(coupon);
    }

    public async Task<CouponDto> UpdateAsync(int id, CouponWriteRequest request, CancellationToken ct = default)
    {
        var coupon = await db.Coupons.FirstOrDefaultAsync(entry => entry.Id == id, ct)
            ?? throw new NotFoundException($"No promotion found with id {id}.");
        var normalized = Normalize(request.Code);

        if (await db.Coupons.IgnoreQueryFilters()
                .AnyAsync(entry => entry.Id != id && entry.NormalizedCode == normalized, ct))
            throw new ConflictException("A promotion with this code already exists.");

        Apply(coupon, request, normalized);
        await db.SaveChangesAsync(ct);
        return ToDto(coupon);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var coupon = await db.Coupons.FirstOrDefaultAsync(entry => entry.Id == id, ct)
            ?? throw new NotFoundException($"No promotion found with id {id}.");

        var carts = await db.Carts.Where(cart => cart.CouponId == id).ToListAsync(ct);
        foreach (var cart in carts) cart.CouponId = null;
        coupon.IsDelete = true;
        coupon.DeletedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private Task<Cart?> LoadCartAsync(string userId, CancellationToken ct) => db.Carts
        .Include(cart => cart.Coupon)
        .Include(cart => cart.Items.Where(item => !item.IsDelete))
            .ThenInclude(item => item.Variant)
                .ThenInclude(variant => variant.Product)
                    .ThenInclude(product => product.Media)
        .AsSplitQuery()
        .FirstOrDefaultAsync(cart => cart.UserId == userId && cart.Status == CartStatus.Open, ct);

    private static void Apply(Coupon coupon, CouponWriteRequest request, string normalized)
    {
        coupon.Name = request.Name.Trim();
        coupon.Code = request.Code.Trim().ToUpperInvariant();
        coupon.NormalizedCode = normalized;
        coupon.DiscountType = request.DiscountType == "fixed_amount"
            ? CouponDiscountType.FixedAmount
            : CouponDiscountType.Percentage;
        coupon.Value = request.Value;
        coupon.MinimumSpend = request.MinimumSpend;
        coupon.IsActive = request.IsActive;
        coupon.StartsAt = request.StartsAt;
        coupon.ExpiresAt = request.ExpiresAt;
        coupon.UsageLimit = request.UsageLimit;
    }

    private static string Normalize(string code) => code.Trim().ToUpperInvariant();

    private static CouponDto ToDto(Coupon coupon) => new()
    {
        Id = coupon.Id,
        Name = coupon.Name,
        Code = coupon.Code,
        DiscountType = coupon.DiscountType == CouponDiscountType.Percentage ? "percentage" : "fixed_amount",
        Value = coupon.Value,
        MinimumSpend = coupon.MinimumSpend,
        IsActive = coupon.IsActive,
        StartsAt = coupon.StartsAt,
        ExpiresAt = coupon.ExpiresAt,
        UsageLimit = coupon.UsageLimit,
        RedemptionCount = coupon.RedemptionCount,
        CreatedAt = coupon.CreatedAt,
    };
}
