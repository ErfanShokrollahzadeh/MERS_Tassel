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

public class OrderService(AppDbContext db) : IOrderService
{
    /// <summary>Window a reservation holds stock before an unpaid order releases it.</summary>
    public static readonly TimeSpan ReservationWindow = TimeSpan.FromMinutes(30);

    private const decimal ExpressShipping = 18m;
    private const decimal StandardShipping = 9m;
    private const decimal FreeShippingThreshold = 120m;

    public async Task<OrderDto> CheckoutAsync(string userId, CheckoutRequest request, CancellationToken ct = default)
    {
        var cart = await db.Carts
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
        var shipping = request.Delivery == "express"
            ? ExpressShipping
            : subtotal >= FreeShippingThreshold ? 0m : StandardShipping;

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);

        var order = new Order
        {
            Number = await NextOrderNumberAsync(ct),
            UserId = userId,
            Email = request.Email.Trim(),
            CustomerName = user is null ? string.Empty : $"{user.FirstName} {user.LastName}".Trim(),
            Status = OrderStatus.Pending,
            PaymentStatus = PaymentStatus.Unpaid,
            Currency = cart.Currency,
            Subtotal = subtotal,
            ShippingTotal = shipping,
            Total = subtotal + shipping,
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
            });

            order.Reservations.Add(new InventoryReservation
            {
                ProductVariantId = variant.Id,
                Quantity = line.Quantity,
                Status = ReservationStatus.Active,
                ExpiresAt = DateTimeOffset.UtcNow.Add(ReservationWindow),
            });

            // Decrement now; the reservation is what gives it back if payment never lands.
            variant.Stock -= line.Quantity;
        }

        db.Orders.Add(order);

        cart.Status = CartStatus.Converted;
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
            .AsSplitQuery()
            .FirstOrDefaultAsync(o => o.StripeCheckoutSessionId == sessionId, ct)
            ?? throw new NotFoundException("No order found for that checkout session.");

        if (restrictToUserId is not null && order.UserId != restrictToUserId)
            throw new NotFoundException("No order found for that checkout session.");

        return ToDto(order);
    }

    public async Task<PagedResult<OrderDto>> ListAsync(OrderQuery query, CancellationToken ct = default)
    {
        var q = db.Orders.Include(o => o.Items).AsQueryable();

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
            .Include(o => o.Reservations)
            .AsSplitQuery()
            .FirstOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new NotFoundException($"No order found with id {id}.");

        // Cancelling or refunding puts reserved stock back on the shelf.
        var returnsStock = parsed is OrderStatus.Cancelled or OrderStatus.Refunded;
        var wasReturned = order.Status is OrderStatus.Cancelled or OrderStatus.Refunded;

        if (returnsStock && !wasReturned)
            await ReleaseReservationsAsync(order, ct);

        order.Status = parsed;
        if (parsed == OrderStatus.Refunded) order.PaymentStatus = PaymentStatus.Refunded;

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
        ShippingTotal = o.ShippingTotal,
        Total = o.Total,
        Channel = o.Channel,
        CreatedAt = o.CreatedAt,
        PaidAt = o.PaidAt,
        ItemCount = o.Items.Sum(i => i.Quantity),
        Items = o.Items.Select(i => new OrderItemDto
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
        }).ToList(),
    };
}
