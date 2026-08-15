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
        var line = cart.Items.FirstOrDefault(i => i.ProductVariantId == variant.Id && !i.IsDelete);

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
}
