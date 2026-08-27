using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Domain.Enums;
using MersTassel.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MersTassel.Infrastructure.Services;

public static class ExchangePolicy
{
    public const int ExchangeBusinessDays = 3;
    public const int ReturnCalendarDays = 14;

    public static DateTimeOffset AddBusinessDays(DateTimeOffset start, int days)
    {
        var result = start;
        var remaining = days;
        while (remaining > 0)
        {
            result = result.AddDays(1);
            if (result.DayOfWeek is not DayOfWeek.Saturday and not DayOfWeek.Sunday) remaining--;
        }
        return result;
    }
}

public class ExchangeService(AppDbContext db, IWalletService wallets) : IExchangeService
{
    public async Task<ExchangeRequestDto> CreateAsync(
        string userId,
        CreateExchangeRequest request,
        CancellationToken ct = default)
    {
        var orderItem = await db.OrderItems
            .Include(x => x.Order)
            .FirstOrDefaultAsync(x => x.Id == request.OrderItemId && x.Order.UserId == userId, ct)
            ?? throw new NotFoundException("That purchased item could not be found.");

        if (orderItem.Order.Status != OrderStatus.Delivered || orderItem.Order.DeliveredAt is null)
            throw new ValidationException("orderItemId", "Exchange requests can start after the order is marked delivered.");

        var deadline = ExchangePolicy.AddBusinessDays(orderItem.Order.DeliveredAt.Value, ExchangePolicy.ExchangeBusinessDays);
        if (DateTimeOffset.UtcNow > deadline)
            throw new ValidationException("orderItemId", "The 3-business-day exchange contact window has ended.");

        var duplicate = await db.ExchangeRequests.AnyAsync(x =>
            x.OrderItemId == request.OrderItemId &&
            x.Status != ExchangeRequestStatus.Rejected &&
            x.Status != ExchangeRequestStatus.Cancelled, ct);
        if (duplicate)
            throw new ConflictException("An active exchange request already exists for this item.");

        var newVariant = await db.ProductVariants
            .Include(x => x.Product)
            .FirstOrDefaultAsync(x => x.Id == request.NewProductVariantId && x.IsActive && x.Product.IsActive, ct)
            ?? throw new NotFoundException("The replacement product is not available.");

        if (newVariant.Stock <= 0)
            throw new ValidationException("newProductVariantId", "The selected replacement is out of stock.");
        if (!string.Equals(newVariant.Product.Currency, orderItem.Order.Currency, StringComparison.OrdinalIgnoreCase))
            throw new ValidationException("newProductVariantId", "The replacement must use the same currency as the original order.");

        var oldValue = orderItem.UnitPrice;
        var newValue = newVariant.PriceOverride ?? newVariant.Product.Price;
        var difference = Math.Round(oldValue - newValue, 2, MidpointRounding.AwayFromZero);
        var exchange = new ExchangeRequest
        {
            UserId = userId,
            OrderItemId = orderItem.Id,
            NewProductVariantId = newVariant.Id,
            OldProductValue = oldValue,
            NewProductValue = newValue,
            Difference = difference,
            WalletCredit = Math.Max(0m, difference),
            AmountDue = Math.Max(0m, -difference),
            Currency = orderItem.Order.Currency,
            InvoiceIntact = request.InvoiceIntact,
            PackagingIntact = request.PackagingIntact,
            CustomerNote = string.IsNullOrWhiteSpace(request.CustomerNote) ? null : request.CustomerNote.Trim(),
            Status = ExchangeRequestStatus.PendingVerification,
        };
        db.ExchangeRequests.Add(exchange);
        await db.SaveChangesAsync(ct);
        return await GetDtoAsync(exchange.Id, ct);
    }

    public async Task<IReadOnlyList<ExchangeRequestDto>> ListForUserAsync(string userId, CancellationToken ct = default)
    {
        var exchanges = await Query().Where(x => x.UserId == userId).OrderByDescending(x => x.CreatedAt).ToListAsync(ct);
        return exchanges.Select(ToDto).ToList();
    }

    public async Task<IReadOnlyList<ExchangeRequestDto>> ListAllAsync(CancellationToken ct = default)
    {
        var exchanges = await Query().OrderByDescending(x => x.CreatedAt).ToListAsync(ct);
        return exchanges.Select(ToDto).ToList();
    }

    public async Task<OrderDto> CreateSettlementOrderAsync(
        string userId,
        int exchangeId,
        ExchangeCheckoutRequest request,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || !new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(request.Email))
            throw new MersTassel.Application.Common.ValidationException("email", "Enter a valid email address.");

        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var exchange = await db.ExchangeRequests
            .Include(x => x.SettlementOrder).ThenInclude(x => x!.Items)
            .Include(x => x.NewProductVariant).ThenInclude(x => x.Product).ThenInclude(x => x.Media)
            .FirstOrDefaultAsync(x => x.Id == exchangeId && x.UserId == userId, ct)
            ?? throw new NotFoundException("That exchange request could not be found.");

        if (exchange.SettlementOrder is not null) return OrderService.ToDto(exchange.SettlementOrder);
        if (exchange.Status != ExchangeRequestStatus.Approved)
            throw new ConflictException("The exchange must be verified and approved before payment.");
        if (exchange.AmountDue <= 0)
            throw new ValidationException("exchangeId", "This exchange has no remaining amount to pay.");
        if (exchange.NewProductVariant.Stock <= 0)
            throw new ValidationException("exchangeId", "The approved replacement is no longer in stock. Contact the atelier.");

        var number = await NextOrderNumberAsync(ct);
        var walletCredit = request.UseWalletBalance
            ? await wallets.ApplyToOrderAsync(userId, exchange.Currency, exchange.AmountDue, number, ct)
            : 0m;
        var total = Math.Max(0m, exchange.AmountDue - walletCredit);
        var paidWithWallet = total == 0m;
        var user = await db.Users.FirstOrDefaultAsync(x => x.Id == userId, ct);
        var product = exchange.NewProductVariant.Product;
        var order = new Order
        {
            Number = number,
            UserId = userId,
            Email = request.Email.Trim(),
            CustomerName = user is null ? string.Empty : $"{user.FirstName} {user.LastName}".Trim(),
            Status = paidWithWallet ? OrderStatus.Processing : OrderStatus.Pending,
            PaymentStatus = paidWithWallet ? PaymentStatus.Paid : PaymentStatus.Unpaid,
            PaidAt = paidWithWallet ? DateTimeOffset.UtcNow : null,
            Currency = exchange.Currency,
            Subtotal = exchange.NewProductValue,
            DiscountTotal = exchange.OldProductValue + walletCredit,
            WalletCredit = walletCredit,
            Total = total,
            Channel = "exchange",
            IdempotencyKey = $"exchange:{exchange.Id}",
        };
        order.Items.Add(new OrderItem
        {
            ProductVariantId = exchange.NewProductVariantId,
            ProductName = product.Name,
            ProductSlug = product.Slug,
            Sku = exchange.NewProductVariant.Sku,
            Color = exchange.NewProductVariant.Color,
            ImagePath = product.Media.Where(x => !x.IsDelete).OrderBy(x => x.SortOrder).Select(x => x.ImagePath).FirstOrDefault(),
            Quantity = 1,
            UnitPrice = exchange.NewProductValue,
        });
        order.Reservations.Add(new InventoryReservation
        {
            ProductVariantId = exchange.NewProductVariantId,
            Quantity = 1,
            Status = paidWithWallet ? ReservationStatus.Converted : ReservationStatus.Active,
            ExpiresAt = DateTimeOffset.UtcNow.Add(OrderService.ReservationWindow),
        });
        exchange.NewProductVariant.Stock -= 1;
        exchange.SettlementOrder = order;
        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return OrderService.ToDto(order);
    }

    public async Task<ExchangeRequestDto> UpdateStatusAsync(
        int id,
        UpdateExchangeStatusRequest request,
        CancellationToken ct = default)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var exchange = await Query().FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException($"No exchange request found with id {id}.");
        var next = ParseStatus(request.Status);

        if (exchange.Status is ExchangeRequestStatus.Rejected or ExchangeRequestStatus.Cancelled or ExchangeRequestStatus.Completed)
            throw new ConflictException("This exchange request is already closed.");
        if (exchange.Status == ExchangeRequestStatus.Approved && next != ExchangeRequestStatus.Completed)
            throw new ConflictException("An approved exchange can only be marked completed.");

        if (next == ExchangeRequestStatus.Approved)
        {
            var walletTransaction = await wallets.CreditExchangeDifferenceAsync(exchange, ct);
            if (walletTransaction is not null) exchange.WalletTransaction = walletTransaction;
        }

        exchange.Status = next;
        exchange.AdminNote = string.IsNullOrWhiteSpace(request.AdminNote) ? null : request.AdminNote.Trim();
        exchange.ReviewedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return ToDto(exchange);
    }

    private IQueryable<ExchangeRequest> Query() => db.ExchangeRequests
        .Include(x => x.OrderItem)
        .Include(x => x.SettlementOrder)
        .Include(x => x.NewProductVariant).ThenInclude(x => x.Product);

    private async Task<ExchangeRequestDto> GetDtoAsync(int id, CancellationToken ct) =>
        ToDto(await Query().FirstAsync(x => x.Id == id, ct));

    internal static ExchangeRequestDto ToDto(ExchangeRequest x) => new()
    {
        Id = x.Id,
        OrderItemId = x.OrderItemId,
        OriginalProductName = x.OrderItem.ProductName,
        NewProductVariantId = x.NewProductVariantId,
        NewProductName = x.NewProductVariant.Product.Name,
        NewProductSlug = x.NewProductVariant.Product.Slug,
        NewProductColor = x.NewProductVariant.Color,
        OldProductValue = x.OldProductValue,
        NewProductValue = x.NewProductValue,
        Difference = x.Difference,
        WalletCredit = x.WalletCredit,
        AmountDue = x.AmountDue,
        Currency = x.Currency,
        InvoiceIntact = x.InvoiceIntact,
        PackagingIntact = x.PackagingIntact,
        CustomerNote = x.CustomerNote,
        AdminNote = x.AdminNote,
        Status = ToApi(x.Status),
        CreatedAt = x.CreatedAt,
        ReviewedAt = x.ReviewedAt,
        SettlementOrderNumber = x.SettlementOrder?.Number,
    };

    private async Task<string> NextOrderNumberAsync(CancellationToken ct)
    {
        var seed = await db.Orders.IgnoreQueryFilters().CountAsync(ct) + 1001;
        for (var attempt = 0; attempt < 8; attempt++)
        {
            var candidate = $"MT-X{seed + attempt}-{Guid.NewGuid():N}"[..18].ToUpperInvariant();
            if (!await db.Orders.IgnoreQueryFilters().AnyAsync(x => x.Number == candidate, ct)) return candidate;
        }
        return $"MT-X{Guid.NewGuid():N}"[..20].ToUpperInvariant();
    }

    private static ExchangeRequestStatus ParseStatus(string value) => value.Trim().ToLowerInvariant() switch
    {
        "approved" => ExchangeRequestStatus.Approved,
        "rejected" => ExchangeRequestStatus.Rejected,
        "cancelled" => ExchangeRequestStatus.Cancelled,
        "completed" => ExchangeRequestStatus.Completed,
        _ => throw new ValidationException("status", "Choose a valid exchange status."),
    };

    private static string ToApi(ExchangeRequestStatus status) => status switch
    {
        ExchangeRequestStatus.PendingVerification => "pending_verification",
        _ => status.ToString().ToLowerInvariant(),
    };
}
