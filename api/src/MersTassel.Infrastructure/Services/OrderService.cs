using System.Security.Cryptography;
using System.Text.Json;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Domain.Enums;
using MersTassel.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MersTassel.Infrastructure.Services;

public class OrderService(AppDbContext db, IWalletService wallets) : IOrderService
{
    /// <summary>Window a reservation holds stock before an unpaid order releases it.</summary>
    public static readonly TimeSpan ReservationWindow = TimeSpan.FromMinutes(30);

    private const decimal ExpressShipping = 60m;
    private const decimal StandardShipping = 30m;
    private const decimal FreeShippingThreshold = 500m;

    public async Task<OrderDto> CheckoutAsync(string userId, CheckoutRequest request, CancellationToken ct = default)
    {
        var cart = await db.Carts
            .Include(c => c.Coupon)
            .Include(c => c.TradeIn)
            .Include(c => c.Items.Where(i => !i.IsDelete))
                .ThenInclude(i => i.Variant)
                    .ThenInclude(v => v.Product)
                        .ThenInclude(p => p.Media)
            .AsSplitQuery()
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Status == CartStatus.Open, ct);

        var lines = cart?.Items.Where(i => !i.IsDelete).ToList() ?? [];
        if (cart is null || lines.Count == 0)
            throw new ValidationException("cart", "Your bag is empty.");

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        // Re-check stock inside the transaction: the catalog may have moved since the bag was filled.
        foreach (var line in lines)
        {
            if (line.Variant.Stock < line.Quantity)
                throw new ValidationException("cart",
                    $"Only {line.Variant.Stock} left of {line.Variant.Product.Name} ({line.Variant.Color}).");
        }

        var subtotal = lines.Sum(l => (l.Variant.PriceOverride ?? l.Variant.Product.Price) * l.Quantity);
        var appliedCoupon = cart.Coupon is null
            ? null
            : CouponPricing.Evaluate(cart.Coupon, subtotal, cart.Currency);
        var couponDiscount = appliedCoupon?.DiscountAmount ?? 0m;
        var tradeInCredit = TradeInService.CalculateAppliedCredit(cart.TradeIn, subtotal - couponDiscount);
        var discount = couponDiscount + tradeInCredit;
        var shipping = request.Delivery == "express"
            ? ExpressShipping
            : subtotal >= FreeShippingThreshold ? 0m : StandardShipping;

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);

        var orderNumber = await NextOrderNumberAsync(ct);
        var walletCredit = request.UseWalletBalance
            ? await wallets.ApplyToOrderAsync(userId, cart.Currency, subtotal - discount, orderNumber, ct)
            : 0m;
        var total = Math.Max(0m, subtotal - discount - walletCredit + shipping);
        var paidWithWallet = total == 0m;

        var order = new Order
        {
            Number = orderNumber,
            UserId = userId,
            Email = request.Email.Trim(),
            CustomerName = user is null ? string.Empty : $"{user.FirstName} {user.LastName}".Trim(),
            Status = paidWithWallet ? OrderStatus.Processing : OrderStatus.Pending,
            PaymentStatus = paidWithWallet ? PaymentStatus.Paid : PaymentStatus.Unpaid,
            PaidAt = paidWithWallet ? DateTimeOffset.UtcNow : null,
            Currency = cart.Currency,
            Subtotal = subtotal,
            DiscountTotal = discount + walletCredit,
            TradeInCredit = tradeInCredit,
            WalletCredit = walletCredit,
            ShippingTotal = shipping,
            Total = total,
            CouponCode = appliedCoupon?.Code,
            CouponDiscountType = appliedCoupon?.DiscountType,
            ShippingAddressJson = request.ShippingAddress is null
                ? "{}"
                : JsonSerializer.Serialize(request.ShippingAddress, new JsonSerializerOptions(JsonSerializerDefaults.Web)),
            Channel = "storefront",
            IdempotencyKey = Guid.NewGuid().ToString("N"),
        };

        foreach (var line in lines)
        {
            var variant = line.Variant;
            var product = variant.Product;
            var unit = variant.PriceOverride ?? product.Price;

            order.Items.Add(new OrderItem
            {
                ProductVariantId = variant.Id,
                ProductName = product.Name,
                ProductSlug = product.Slug,
                Sku = variant.Sku,
                Color = variant.Color,
                ImagePath = product.Media.Where(m => !m.IsDelete)
                    .OrderBy(m => m.SortOrder).ThenBy(m => m.Id)
                    .Select(m => m.ImagePath).FirstOrDefault(),
                Quantity = line.Quantity,
                UnitPrice = unit,
                GiftBoxKey = line.GiftBoxKey,
                GiftMessage = line.GiftMessage,
                PackagingNotes = line.PackagingNotes,
            });

            order.Reservations.Add(new InventoryReservation
            {
                ProductVariantId = variant.Id,
                Quantity = line.Quantity,
                Status = paidWithWallet ? ReservationStatus.Converted : ReservationStatus.Active,
                ExpiresAt = DateTimeOffset.UtcNow.Add(ReservationWindow),
            });

            // Decrement now; the reservation is what gives it back if payment never lands.
            variant.Stock -= line.Quantity;
        }

        db.Orders.Add(order);

        if (cart.TradeIn is not null && tradeInCredit > 0)
        {
            cart.TradeIn.Status = TradeInStatus.PendingVerification;
            cart.TradeIn.CartId = null;
            cart.TradeIn.Cart = null;
            cart.TradeIn.Order = order;
            order.TradeIn = cart.TradeIn;
            cart.TradeIn = null;
        }

        if (appliedCoupon is not null && cart.Coupon is not null)
            cart.Coupon.RedemptionCount += 1;

        cart.Status = CartStatus.Converted;
        cart.CouponId = null;
        foreach (var line in lines)
        {
            line.IsDelete = true;
            line.DeletedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return await GetByNumberAsync(order.Number, userId, ct);
    }

    public async Task<IReadOnlyList<OrderDto>> ListForUserAsync(string userId, CancellationToken ct = default)
    {
        var orders = await db.Orders
            .Include(o => o.Items)
            .Include(o => o.TradeIn)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .AsSplitQuery()
            .ToListAsync(ct);

        return orders.Select(ToDto).ToList();
    }

    public async Task<OrderDto> GetByNumberAsync(string number, string? restrictToUserId, CancellationToken ct = default)
    {
        var order = await db.Orders
            .Include(o => o.Items)
            .Include(o => o.TradeIn)
            .AsSplitQuery()
            .FirstOrDefaultAsync(o => o.Number == number, ct)
            ?? throw new NotFoundException($"No order found with number {number}.");

        if (restrictToUserId is not null && order.UserId != restrictToUserId)
            throw new NotFoundException($"No order found with number {number}.");

        return ToDto(order);
    }

    public async Task<OrderDto> GetByStripeSessionAsync(string sessionId, string? restrictToUserId, CancellationToken ct = default)
    {
        var order = await db.Orders
            .Include(o => o.Items)
            .Include(o => o.TradeIn)
            .AsSplitQuery()
            .FirstOrDefaultAsync(o => o.StripeCheckoutSessionId == sessionId, ct)
            ?? throw new NotFoundException("No order found for that checkout session.");

        if (restrictToUserId is not null && order.UserId != restrictToUserId)
            throw new NotFoundException("No order found for that checkout session.");

        return ToDto(order);
    }

    public async Task<PagedResult<OrderDto>> ListAsync(OrderQuery query, CancellationToken ct = default)
    {
        var q = db.Orders.Include(o => o.Items).Include(o => o.TradeIn).AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Status) &&
            OrderStatusNames.TryParseOrderStatus(query.Status, out var status))
        {
            q = q.Where(o => o.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            q = q.Where(o =>
                EF.Functions.Like(o.Number, $"%{term}%") ||
                EF.Functions.Like(o.Email, $"%{term}%") ||
                EF.Functions.Like(o.CustomerName, $"%{term}%"));
        }

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var total = await q.CountAsync(ct);
        var orders = await q
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .ToListAsync(ct);

        return new PagedResult<OrderDto>(orders.Select(ToDto).ToList(), page, pageSize, total);
    }

    public async Task<OrderDto> UpdateStatusAsync(int id, string status, CancellationToken ct = default)
    {
        if (!OrderStatusNames.TryParseOrderStatus(status, out var parsed))
            throw new ValidationException("status", $"'{status}' is not a valid order status.");

        var order = await db.Orders
            .Include(o => o.Items)
            .Include(o => o.TradeIn)
            .Include(o => o.Reservations)
            .AsSplitQuery()
            .FirstOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new NotFoundException($"No order found with id {id}.");

        // Cancelling or refunding puts reserved stock back on the shelf.
        var returnsStock = parsed is OrderStatus.Cancelled or OrderStatus.Refunded;
        var wasReturned = order.Status is OrderStatus.Cancelled or OrderStatus.Refunded;

        if (returnsStock && !wasReturned)
        {
            await ReleaseReservationsAsync(order, ct);
            await wallets.ReverseOrderDebitAsync(order, ct);
        }

        order.Status = parsed;
        if (parsed == OrderStatus.Refunded) order.PaymentStatus = PaymentStatus.Refunded;
        if (parsed == OrderStatus.Delivered && order.DeliveredAt is null) order.DeliveredAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);
        return ToDto(order);
    }

    private async Task ReleaseReservationsAsync(Order order, CancellationToken ct)
    {
        var active = order.Reservations.Where(r => r.Status == ReservationStatus.Active).ToList();
        if (active.Count == 0) return;

        var variantIds = active.Select(r => r.ProductVariantId).ToList();
        var variants = await db.ProductVariants
            .IgnoreQueryFilters()
            .Where(v => variantIds.Contains(v.Id))
            .ToDictionaryAsync(v => v.Id, ct);

        foreach (var reservation in active)
        {
            if (variants.TryGetValue(reservation.ProductVariantId, out var variant))
                variant.Stock += reservation.Quantity;

            reservation.Status = ReservationStatus.Released;
        }
    }

    /// <summary>
    /// Sequential-looking order number with a random tail, so numbers stay readable without
    /// leaking exact order volume to customers.
    /// </summary>
    private async Task<string> NextOrderNumberAsync(CancellationToken ct)
    {
        var seed = await db.Orders.IgnoreQueryFilters().CountAsync(ct) + 1001;

        for (var attempt = 0; attempt < 8; attempt++)
        {
            var candidate = $"MT-{seed + attempt}{RandomNumberGenerator.GetInt32(10, 100)}";
            if (!await db.Orders.IgnoreQueryFilters().AnyAsync(o => o.Number == candidate, ct))
                return candidate;
        }

        return $"MT-{Guid.NewGuid():N}"[..20].ToUpperInvariant();
    }

    internal static OrderDto ToDto(Order o) => new()
    {
        Id = o.Id,
        Number = o.Number,
        Email = o.Email,
        CustomerName = o.CustomerName,
        Status = OrderStatusNames.ToApi(o.Status),
        PaymentStatus = OrderStatusNames.ToApi(o.PaymentStatus),
        Currency = o.Currency,
        Subtotal = o.Subtotal,
        DiscountTotal = o.DiscountTotal,
        CouponDiscountTotal = Math.Max(0m, o.DiscountTotal - o.TradeInCredit - o.WalletCredit),
        TradeInCredit = o.TradeInCredit,
        WalletCredit = o.WalletCredit,
        ShippingTotal = o.ShippingTotal,
        Total = o.Total,
        CouponCode = o.CouponCode,
        CouponDiscountType = o.CouponDiscountType,
        TradeIn = TradeInService.ToDto(o.TradeIn, o.TradeInCredit),
        Channel = o.Channel,
        CreatedAt = o.CreatedAt,
        PaidAt = o.PaidAt,
        DeliveredAt = o.DeliveredAt,
        ExchangeEligibleUntil = o.DeliveredAt.HasValue
            ? ExchangePolicy.AddBusinessDays(o.DeliveredAt.Value, ExchangePolicy.ExchangeBusinessDays)
            : null,
        ReturnEligibleUntil = o.DeliveredAt?.AddDays(ExchangePolicy.ReturnCalendarDays),
        ItemCount = o.Items.Sum(i => i.Quantity),
        Items = o.Items.Select(i =>
        {
            var surprise = i.GiftBoxKey?.StartsWith("SUR-", StringComparison.Ordinal) == true
                ? SurpriseBoxPreferenceCodec.Parse(i.PackagingNotes)
                : null;

            return new OrderItemDto
            {
                Id = i.Id,
                ProductName = i.ProductName,
                ProductSlug = i.ProductSlug,
                Sku = i.Sku,
                Color = i.Color,
                Image = i.ImagePath,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                LineTotal = i.UnitPrice * i.Quantity,
                GiftBoxKey = i.GiftBoxKey,
                GiftMessage = i.GiftMessage,
                PackagingNotes = i.PackagingNotes,
                SurpriseRecipient = surprise?.Recipient,
                SurpriseVibes = surprise?.Vibes ?? [],
                SurpriseInstructions = surprise?.SpecialInstructions,
            };
        }).ToList(),
    };
}
