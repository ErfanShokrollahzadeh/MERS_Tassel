using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Domain.Enums;
using MersTassel.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MersTassel.Infrastructure.Services;

public class CartService(AppDbContext db) : ICartService
{
    private const int MaxPerLine = 10;
    private static readonly HashSet<string> JewelryCategories = new(StringComparer.OrdinalIgnoreCase)
    {
        "rings", "earrings", "necklaces", "bracelets", "anklets",
        "hand-harness-bracelets", "shahmaran-bracelets", "arm-cuffs",
    };

    public async Task<CartDto> GetAsync(string userId, CancellationToken ct = default)
    {
        var cart = await LoadAsync(userId, ct);
        return cart is null ? Empty() : ToDto(cart);
    }

    public async Task<CartDto> AddItemAsync(string userId, AddCartItemRequest request, CancellationToken ct = default)
    {
        var product = await db.Products
            .Include(p => p.Variants)
            .Include(p => p.Media)
            .FirstOrDefaultAsync(p => p.Slug == request.ProductSlug && p.IsActive, ct)
            ?? throw new NotFoundException($"No product found for '{request.ProductSlug}'.");

        var active = product.Variants.Where(v => !v.IsDelete && v.IsActive).ToList();
        if (active.Count == 0)
            throw new ValidationException("productSlug", "This piece has no sellable options right now.");

        // Match the requested colour; fall back to the first option when the client sent none.
        var variant = string.IsNullOrWhiteSpace(request.Color)
            ? active[0]
            : active.FirstOrDefault(v => string.Equals(v.Color, request.Color, StringComparison.OrdinalIgnoreCase))
              ?? throw new ValidationException("color", $"'{request.Color}' is not available for this piece.");

        if (variant.Stock <= 0)
            throw new ValidationException("quantity", "That option is sold out.");

        var cart = await LoadAsync(userId, ct) ?? await CreateAsync(userId, product.Currency, ct);
        var line = cart.Items.FirstOrDefault(i =>
            i.ProductVariantId == variant.Id && !i.IsDelete && i.GiftBoxKey == null);

        var desired = (line?.Quantity ?? 0) + request.Quantity;
        var capped = Math.Min(desired, Math.Min(variant.Stock, MaxPerLine));

        if (capped <= 0)
            throw new ValidationException("quantity", "That option is sold out.");

        if (line is null)
        {
            cart.Items.Add(new CartItem { CartId = cart.Id, ProductVariantId = variant.Id, Quantity = capped });
        }
        else
        {
            line.Quantity = capped;
        }

        await db.SaveChangesAsync(ct);
        return ToDto((await LoadAsync(userId, ct))!);
    }

    public async Task<CartDto> AddGiftBoxAsync(
        string userId,
        AddGiftBoxRequest request,
        CancellationToken ct = default)
    {
        var requestedSlugs = request.Items
            .Select(item => item.ProductSlug.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var products = await db.Products
            .Include(product => product.Category)
            .Include(product => product.Variants)
            .Include(product => product.Media)
            .Where(product => requestedSlugs.Contains(product.Slug) && product.IsActive)
            .AsSplitQuery()
            .ToListAsync(ct);

        if (products.Count != requestedSlugs.Count)
            throw new ValidationException("items", "One or more selected Kavanoz pieces are no longer available.");

        if (!products.Any(product => JewelryCategories.Contains(product.Category.Slug)))
            throw new ValidationException("items", "Choose at least one jewelry piece for your Kavanoz box.");

        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var cart = await LoadAsync(userId, ct) ?? await CreateAsync(userId, products[0].Currency, ct);
        var prepared = new List<ProductVariant>();

        foreach (var item in request.Items)
        {
            var product = products.First(product =>
                string.Equals(product.Slug, item.ProductSlug.Trim(), StringComparison.OrdinalIgnoreCase));
            var active = product.Variants.Where(variant => !variant.IsDelete && variant.IsActive).ToList();

            if (active.Count == 0)
                throw new ValidationException("items", $"{product.Name} has no sellable options right now.");

            var variant = string.IsNullOrWhiteSpace(item.Color)
                ? active.FirstOrDefault(option => option.Stock > 0) ?? active[0]
                : active.FirstOrDefault(option =>
                    string.Equals(option.Color, item.Color.Trim(), StringComparison.OrdinalIgnoreCase))
                  ?? throw new ValidationException("items", $"The selected finish for {product.Name} is unavailable.");

            var alreadyInCart = cart.Items
                .Where(line => !line.IsDelete && line.ProductVariantId == variant.Id)
                .Sum(line => line.Quantity);
            var alreadyPrepared = prepared.Count(entry => entry.Id == variant.Id);

            if (variant.Stock <= alreadyInCart + alreadyPrepared)
                throw new ValidationException("items", $"There is not enough stock left for {product.Name} ({variant.Color}).");

            prepared.Add(variant);
        }

        var giftBoxKey = $"KAV-{Guid.NewGuid():N}";
        var giftMessage = CleanOptional(request.GiftMessage);
        var packagingNotes = CleanOptional(request.PackagingNotes);

        foreach (var variant in prepared)
        {
            cart.Items.Add(new CartItem
            {
                CartId = cart.Id,
                ProductVariantId = variant.Id,
                Quantity = 1,
                GiftBoxKey = giftBoxKey,
                GiftMessage = giftMessage,
                PackagingNotes = packagingNotes,
            });
        }

        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return ToDto((await LoadAsync(userId, ct))!);
    }

    public async Task<CartDto> UpdateItemAsync(string userId, int itemId, int quantity, CancellationToken ct = default)
    {
        var cart = await LoadAsync(userId, ct) ?? throw new NotFoundException("No open bag for this account.");
        var line = cart.Items.FirstOrDefault(i => i.Id == itemId && !i.IsDelete)
            ?? throw new NotFoundException($"No bag item found with id {itemId}.");

        if (quantity <= 0)
        {
            line.IsDelete = true;
            line.DeletedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            var stock = line.Variant.Stock;
            if (quantity > stock)
                throw new ValidationException("quantity", $"Only {stock} left in this finish.");

            line.Quantity = Math.Min(quantity, MaxPerLine);
        }

        await db.SaveChangesAsync(ct);
        return ToDto((await LoadAsync(userId, ct))!);
    }

    public async Task<CartDto> RemoveItemAsync(string userId, int itemId, CancellationToken ct = default)
    {
        var cart = await LoadAsync(userId, ct) ?? throw new NotFoundException("No open bag for this account.");
        var line = cart.Items.FirstOrDefault(i => i.Id == itemId && !i.IsDelete)
            ?? throw new NotFoundException($"No bag item found with id {itemId}.");

        line.IsDelete = true;
        line.DeletedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);

        return ToDto((await LoadAsync(userId, ct))!);
    }

    public async Task ClearAsync(string userId, CancellationToken ct = default)
    {
        var cart = await LoadAsync(userId, ct);
        if (cart is null) return;

        foreach (var item in cart.Items.Where(i => !i.IsDelete))
        {
            item.IsDelete = true;
            item.DeletedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);
    }

    private Task<Cart?> LoadAsync(string userId, CancellationToken ct) => db.Carts
        .Include(c => c.Items.Where(i => !i.IsDelete))
            .ThenInclude(i => i.Variant)
                .ThenInclude(v => v.Product)
                    .ThenInclude(p => p.Media)
        .AsSplitQuery()
        .FirstOrDefaultAsync(c => c.UserId == userId && c.Status == CartStatus.Open, ct);

    private async Task<Cart> CreateAsync(string userId, string currency, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException("Account not found.");

        var cart = new Cart
        {
            UserId = userId,
            Email = user.Email ?? string.Empty,
            Currency = currency,
            Status = CartStatus.Open,
        };

        db.Carts.Add(cart);
        await db.SaveChangesAsync(ct);
        return cart;
    }

    private static CartDto Empty() => new() { Items = [], Subtotal = 0, Count = 0 };

    internal static CartDto ToDto(Cart cart)
    {
        var items = cart.Items.Where(i => !i.IsDelete).OrderBy(i => i.Id).Select(i =>
        {
            var variant = i.Variant;
            var product = variant.Product;
            var unit = variant.PriceOverride ?? product.Price;
            var image = product.Media.Where(m => !m.IsDelete)
                .OrderBy(m => m.SortOrder).ThenBy(m => m.Id)
                .Select(m => m.ImagePath).FirstOrDefault();

            return new CartItemDto
            {
                Id = i.Id,
                VariantId = variant.Id,
                ProductId = product.Id,
                ProductName = product.Name,
                ProductNameTr = product.NameTr,
                ProductSlug = product.Slug,
                Sku = variant.Sku,
                Color = variant.Color,
                ColorTr = variant.ColorTr,
                Image = image,
                Quantity = i.Quantity,
                UnitPrice = unit,
                LineTotal = unit * i.Quantity,
                AvailableStock = variant.Stock,
                GiftBoxKey = i.GiftBoxKey,
                GiftMessage = i.GiftMessage,
                PackagingNotes = i.PackagingNotes,
            };
        }).ToList();

        return new CartDto
        {
            Id = cart.Id,
            Currency = cart.Currency,
            Items = items,
            Subtotal = items.Sum(i => i.LineTotal),
            Count = items.Sum(i => i.Quantity),
        };
    }

    private static string? CleanOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
