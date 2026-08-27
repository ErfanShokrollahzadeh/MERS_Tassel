using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Domain.Enums;
using MersTassel.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MersTassel.Infrastructure.Services;

public class TradeInService(AppDbContext db, IFileStorageService storage, IWalletService wallets) : ITradeInService
{
    private static readonly IReadOnlyDictionary<string, decimal> CategoryCredits =
        new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
        {
            ["jewelry"] = 50m,
            ["accessories"] = 24m,
            ["leather"] = 40m,
            ["textiles"] = 30m,
            ["other"] = 20m,
        };

    public Task<TradeInEstimateDto> EstimateAsync(TradeInEstimateRequest request, CancellationToken ct = default)
    {
        var credit = CalculateEstimate(request.Category, request.Condition, request.TargetProductPrice);
        return Task.FromResult(new TradeInEstimateDto
        {
            EstimatedCredit = credit,
            Currency = "USD",
            EstimatedPriceAfterTradeIn = request.TargetProductPrice.HasValue
                ? Math.Max(0m, request.TargetProductPrice.Value - credit)
                : null,
        });
    }

    public async Task<CartDto> ApplyAsync(
        string userId,
        ApplyTradeInRequest request,
        UploadedFile image,
        CancellationToken ct = default)
    {
        storage.Validate(image.Content, image.FileName, image.Length);

        var cart = await LoadCartAsync(userId, ct)
            ?? throw new ValidationException("cart", "Add a product to your bag before applying a trade-in.");
        var subtotal = CartService.CalculateSubtotal(cart);
        if (subtotal <= 0)
            throw new ValidationException("cart", "Add a product to your bag before applying a trade-in.");

        Product? target = null;
        if (!string.IsNullOrWhiteSpace(request.TargetProductSlug))
        {
            target = await db.Products
                .FirstOrDefaultAsync(product =>
                    product.Slug == request.TargetProductSlug.Trim() && product.IsActive, ct);
        }

        var targetPrice = target?.Price ?? subtotal;
        var estimate = CalculateEstimate(request.Category, request.Condition, targetPrice);
        var newImagePath = await storage.SaveAsync(image.Content, image.FileName, "trade-ins", ct);
        var previousImagePath = cart.TradeIn?.ImagePath;

        try
        {
            var tradeIn = cart.TradeIn;
            if (tradeIn is null)
            {
                tradeIn = new TradeInRequest { UserId = userId, CartId = cart.Id };
                db.TradeInRequests.Add(tradeIn);
                cart.TradeIn = tradeIn;
            }

            tradeIn.Category = Normalize(request.Category);
            tradeIn.BrandModel = request.BrandModel.Trim();
            tradeIn.Condition = ParseCondition(request.Condition);
            tradeIn.ImagePath = newImagePath;
            tradeIn.TargetProductSlug = target?.Slug;
            tradeIn.TargetProductName = target?.Name;
            tradeIn.TargetProductPrice = target?.Price;
            tradeIn.EstimatedCredit = estimate;
            tradeIn.Currency = cart.Currency;
            tradeIn.HandoffMethod = ParseHandoff(request.HandoffMethod);
            tradeIn.Status = TradeInStatus.PendingVerification;
            tradeIn.AdminNote = null;
            tradeIn.IsDelete = false;
            tradeIn.DeletedAt = null;

            await db.SaveChangesAsync(ct);
        }
        catch
        {
            await storage.DeleteAsync(newImagePath, ct);
            throw;
        }

        if (!string.IsNullOrWhiteSpace(previousImagePath) && previousImagePath != newImagePath)
            await storage.DeleteAsync(previousImagePath, ct);

        return CartService.ToDto((await LoadCartAsync(userId, ct))!);
    }

    public async Task<CartDto> RemoveAsync(string userId, CancellationToken ct = default)
    {
        var cart = await LoadCartAsync(userId, ct)
            ?? throw new NotFoundException("No open bag for this account.");

        if (cart.TradeIn is not null)
        {
            cart.TradeIn.Status = TradeInStatus.Cancelled;
            cart.TradeIn.CartId = null;
            cart.TradeIn.Cart = null;
            cart.TradeIn = null;
            await db.SaveChangesAsync(ct);
        }

        return CartService.ToDto(cart);
    }

    public async Task<TradeInDto> UpdateStatusAsync(
        int id,
        UpdateTradeInStatusRequest request,
        CancellationToken ct = default)
    {
        var tradeIn = await db.TradeInRequests
            .Include(entry => entry.Order)
            .FirstOrDefaultAsync(entry => entry.Id == id, ct)
            ?? throw new NotFoundException($"No trade-in found with id {id}.");

        tradeIn.Status = ParseStatus(request.Status);
        tradeIn.AdminNote = string.IsNullOrWhiteSpace(request.AdminNote) ? null : request.AdminNote.Trim();
        if (tradeIn.Status == TradeInStatus.Approved)
            await wallets.CreditTradeInRemainderAsync(tradeIn, ct);
        await db.SaveChangesAsync(ct);
        return ToDto(tradeIn)!;
    }

    internal static decimal CalculateAppliedCredit(TradeInRequest? tradeIn, decimal availableSubtotal)
    {
        if (tradeIn is null || tradeIn.Status != TradeInStatus.PendingVerification || availableSubtotal <= 0)
            return 0m;

        return Math.Min(availableSubtotal, tradeIn.EstimatedCredit);
    }

    internal static TradeInDto? ToDto(TradeInRequest? tradeIn, decimal? appliedCredit = null)
    {
        if (tradeIn is null) return null;
        var credit = appliedCredit ?? tradeIn.EstimatedCredit;
        return new TradeInDto
        {
            Id = tradeIn.Id,
            Category = tradeIn.Category,
            BrandModel = tradeIn.BrandModel,
            Condition = ToApi(tradeIn.Condition),
            ImagePath = tradeIn.ImagePath,
            TargetProductSlug = tradeIn.TargetProductSlug,
            TargetProductName = tradeIn.TargetProductName,
            TargetProductPrice = tradeIn.TargetProductPrice,
            EstimatedCredit = credit,
            EstimatedPriceAfterTradeIn = tradeIn.TargetProductPrice.HasValue
                ? Math.Max(0m, tradeIn.TargetProductPrice.Value - credit)
                : null,
            Currency = tradeIn.Currency,
            HandoffMethod = ToApi(tradeIn.HandoffMethod),
            Status = ToApi(tradeIn.Status),
            AdminNote = tradeIn.AdminNote,
            CreatedAt = tradeIn.CreatedAt,
        };
    }

    private Task<Cart?> LoadCartAsync(string userId, CancellationToken ct) => db.Carts
        .Include(cart => cart.Coupon)
        .Include(cart => cart.TradeIn)
        .Include(cart => cart.Items.Where(item => !item.IsDelete))
            .ThenInclude(item => item.Variant)
                .ThenInclude(variant => variant.Product)
                    .ThenInclude(product => product.Media)
        .AsSplitQuery()
        .FirstOrDefaultAsync(cart => cart.UserId == userId && cart.Status == CartStatus.Open, ct);

    private static decimal CalculateEstimate(string category, string condition, decimal? targetPrice)
    {
        var baseCredit = CategoryCredits.TryGetValue(Normalize(category), out var amount) ? amount : 20m;
        var multiplier = Normalize(condition) switch
        {
            "like_new" => 1m,
            "good" => .72m,
            "fair" => .45m,
            _ => .45m,
        };

        var estimate = Math.Round(baseCredit * multiplier, 2, MidpointRounding.AwayFromZero);
        return targetPrice.HasValue ? Math.Min(estimate, Math.Round(targetPrice.Value * .45m, 2)) : estimate;
    }

    private static TradeInCondition ParseCondition(string value) => Normalize(value) switch
    {
        "like_new" => TradeInCondition.LikeNew,
        "good" => TradeInCondition.Good,
        _ => TradeInCondition.Fair,
    };

    private static TradeInHandoffMethod ParseHandoff(string value) => Normalize(value) switch
    {
        "pickup" => TradeInHandoffMethod.Pickup,
        _ => TradeInHandoffMethod.DropOff,
    };

    private static TradeInStatus ParseStatus(string value) => Normalize(value) switch
    {
        "approved" => TradeInStatus.Approved,
        "rejected" => TradeInStatus.Rejected,
        "cancelled" => TradeInStatus.Cancelled,
        _ => TradeInStatus.PendingVerification,
    };

    private static string ToApi(TradeInCondition value) => value switch
    {
        TradeInCondition.LikeNew => "like_new",
        TradeInCondition.Good => "good",
        _ => "fair",
    };

    private static string ToApi(TradeInHandoffMethod value) => value == TradeInHandoffMethod.Pickup ? "pickup" : "drop_off";

    private static string ToApi(TradeInStatus value) => value switch
    {
        TradeInStatus.PendingVerification => "pending_verification",
        TradeInStatus.Approved => "approved",
        TradeInStatus.Rejected => "rejected",
        TradeInStatus.Cancelled => "cancelled",
        _ => "draft",
    };

    private static string Normalize(string value) => value.Trim().ToLowerInvariant();
}
