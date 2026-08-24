using System.Globalization;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Domain.Entities;
using MersTassel.Domain.Enums;

namespace MersTassel.Infrastructure.Services;

internal static class CouponPricing
{
    public static AppliedCouponDto Evaluate(
        Coupon coupon,
        decimal subtotal,
        string currency,
        DateTimeOffset? now = null)
    {
        var instant = now ?? DateTimeOffset.UtcNow;

        if (!coupon.IsActive || coupon.IsDelete)
            throw new CouponException("inactive_coupon", "This coupon is not currently active.");
        if (coupon.StartsAt.HasValue && coupon.StartsAt.Value > instant)
            throw new CouponException("coupon_not_started", "This coupon is not available yet.");
        if (coupon.ExpiresAt.HasValue && coupon.ExpiresAt.Value <= instant)
            throw new CouponException("expired_coupon", "This coupon has expired.");
        if (coupon.UsageLimit.HasValue && coupon.RedemptionCount >= coupon.UsageLimit.Value)
            throw new CouponException("coupon_limit_reached", "This coupon has reached its usage limit.");
        if (subtotal < coupon.MinimumSpend)
            throw new CouponException(
                "minimum_spend",
                $"Minimum spend of {Money(coupon.MinimumSpend, currency)} required.");

        var amount = coupon.DiscountType == CouponDiscountType.Percentage
            ? decimal.Round(subtotal * coupon.Value / 100m, 2, MidpointRounding.AwayFromZero)
            : coupon.Value;
        amount = Math.Clamp(amount, 0m, subtotal);

        return new AppliedCouponDto
        {
            Code = coupon.Code,
            DiscountType = coupon.DiscountType == CouponDiscountType.Percentage ? "percentage" : "fixed_amount",
            Value = coupon.Value,
            MinimumSpend = coupon.MinimumSpend,
            DiscountAmount = amount,
            Badge = coupon.DiscountType == CouponDiscountType.Percentage
                ? $"{coupon.Value:0.##}% OFF"
                : $"{Money(coupon.Value, currency)} OFF",
        };
    }

    public static AppliedCouponDto? TryEvaluate(Coupon? coupon, decimal subtotal, string currency)
    {
        if (coupon is null) return null;
        try { return Evaluate(coupon, subtotal, currency); }
        catch (CouponException) { return null; }
    }

    private static string Money(decimal amount, string currency) => currency.ToUpperInvariant() switch
    {
        "USD" => $"${amount.ToString("#,0.##", CultureInfo.GetCultureInfo("en-US"))}",
        "TRY" => $"₺{amount.ToString("#,0.##", CultureInfo.GetCultureInfo("tr-TR"))}",
        "EUR" => $"€{amount.ToString("#,0.##", CultureInfo.GetCultureInfo("en-US"))}",
        _ => $"{amount.ToString("#,0.##", CultureInfo.InvariantCulture)} {currency.ToUpperInvariant()}",
    };
}
