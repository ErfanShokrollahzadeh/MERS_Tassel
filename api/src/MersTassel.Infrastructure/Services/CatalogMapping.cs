using MersTassel.Application.DTOs;
using MersTassel.Domain.Entities;

namespace MersTassel.Infrastructure.Services;

/// <summary>
/// Projects catalog entities onto the storefront's DTO shape. Kept as explicit hand-written
/// mapping because <c>ProductDto</c> flattens variants and media into <c>stock</c>,
/// <c>colors</c> and <c>images</c> — derivations a convention-based mapper cannot infer.
/// </summary>
public static class CatalogMapping
{
    public static ProductDto ToDto(this Product p)
    {
        var activeVariants = p.Variants.Where(v => !v.IsDelete && v.IsActive).OrderBy(v => v.Id).ToList();
        var media = p.Media.Where(m => !m.IsDelete).OrderBy(m => m.SortOrder).ThenBy(m => m.Id).ToList();
        var images = media.Select(m => m.ImagePath).ToList();

        return new ProductDto
        {
            Id = p.Id,
            Name = p.Name,
            NameTr = p.NameTr,
            Slug = p.Slug,
            CategoryId = p.CategoryId,
            Category = p.Category?.Name ?? string.Empty,
            CategoryTr = p.Category?.NameTr,
            CategorySlug = p.Category?.Slug ?? string.Empty,
            Description = p.Description,
            DescriptionTr = p.DescriptionTr,
            Story = p.Story,
            StoryTr = p.StoryTr,
            Material = p.Material,
            MaterialTr = p.MaterialTr,
            Dimensions = p.Dimensions,
            DimensionsTr = p.DimensionsTr,
            Price = new MoneyDto(p.Price, p.Currency),
            CompareAt = p.CompareAtPrice.HasValue ? new MoneyDto(p.CompareAtPrice.Value, p.Currency) : null,
            Image = images.FirstOrDefault() ?? string.Empty,
            Images = images,
            Colors = activeVariants.Select(v => v.Color).Where(c => !string.IsNullOrWhiteSpace(c)).Distinct().ToList(),
            Rating = p.Rating,
            Reviews = p.ReviewCount,
            Stock = activeVariants.Sum(v => v.Stock),
            IsNew = p.IsNew,
            IsFeatured = p.IsFeatured,
            IsActive = p.IsActive,
            Sku = p.Sku,
            SeoTitle = p.SeoTitle,
            MetaDescription = p.MetaDescription,
            Variants = activeVariants.Select(v => v.ToDto(p.Price)).ToList(),
            MediaItems = media.Select(m => new ProductMediaDto
            {
                Id = m.Id,
                ImagePath = m.ImagePath,
                Alt = m.Alt,
                SortOrder = m.SortOrder,
                IsPrimary = m.IsPrimary,
            }).ToList(),
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
        };
    }

    public static ProductVariantDto ToDto(this ProductVariant v, decimal productPrice) => new()
    {
        Id = v.Id,
        Title = v.Title,
        Sku = v.Sku,
        Color = v.Color,
        ColorTr = v.ColorTr,
        SwatchHex = v.SwatchHex,
        Price = v.PriceOverride ?? productPrice,
        PriceOverride = v.PriceOverride,
        Stock = v.Stock,
        LowStockThreshold = v.LowStockThreshold,
        IsActive = v.IsActive,
    };

    public static CategoryDto ToDto(this Category c, int count) => new()
    {
        Id = c.Id,
        Name = c.Name,
        NameTr = c.NameTr,
        Slug = c.Slug,
        Description = c.Description,
        DescriptionTr = c.DescriptionTr,
        Image = c.ImagePath,
        SortOrder = c.SortOrder,
        Count = count,
    };

    /// <summary>
    /// URL-safe slug. Turkish characters are folded to ASCII so a Turkish title still yields
    /// a routable slug rather than percent-escapes.
    /// </summary>
    public static string Slugify(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;

        var folded = value.Trim().ToLowerInvariant()
            .Replace("ı", "i").Replace("İ", "i")
            .Replace("ş", "s").Replace("Ş", "s")
            .Replace("ğ", "g").Replace("Ğ", "g")
            .Replace("ü", "u").Replace("Ü", "u")
            .Replace("ö", "o").Replace("Ö", "o")
            .Replace("ç", "c").Replace("Ç", "c")
            .Replace("â", "a").Replace("î", "i").Replace("û", "u")
            .Replace("é", "e").Replace("è", "e");

        var builder = new System.Text.StringBuilder(folded.Length);
        var lastWasHyphen = false;

        foreach (var ch in folded)
        {
            if (char.IsLetterOrDigit(ch) && ch < 128)
            {
                builder.Append(ch);
                lastWasHyphen = false;
            }
            else if (!lastWasHyphen && builder.Length > 0)
            {
                builder.Append('-');
                lastWasHyphen = true;
            }
        }

        return builder.ToString().Trim('-');
    }
}
