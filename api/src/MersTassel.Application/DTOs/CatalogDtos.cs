namespace MersTassel.Application.DTOs;

public record MoneyDto(decimal Amount, string Currency);

/// <summary>
/// Shaped to match the storefront's existing <c>Product</c> TypeScript type field-for-field
/// (plus <c>*Tr</c> localization and variant detail), so the UI components bind to live data
/// without changing their props.
/// </summary>
public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameTr { get; set; }
    public string Slug { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;
    public string? CategoryTr { get; set; }
    public string CategorySlug { get; set; } = string.Empty;
    public int CategoryId { get; set; }

    public string Description { get; set; } = string.Empty;
    public string? DescriptionTr { get; set; }
    public string Story { get; set; } = string.Empty;
    public string? StoryTr { get; set; }
    public string Material { get; set; } = string.Empty;
    public string? MaterialTr { get; set; }
    public string Dimensions { get; set; } = string.Empty;
    public string? DimensionsTr { get; set; }

    public MoneyDto Price { get; set; } = new(0, "USD");
    public MoneyDto? CompareAt { get; set; }

    /// <summary>Primary image, relative (<c>/uploads/...</c>). Empty when the product has no media.</summary>
    public string Image { get; set; } = string.Empty;

    public IReadOnlyList<string> Images { get; set; } = [];
    public IReadOnlyList<string> Colors { get; set; } = [];

    public double Rating { get; set; }
    public int Reviews { get; set; }

    /// <summary>Sum of stock across active variants.</summary>
    public int Stock { get; set; }

    public bool IsNew { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsActive { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string SeoTitle { get; set; } = string.Empty;
    public string MetaDescription { get; set; } = string.Empty;

    public IReadOnlyList<ProductVariantDto> Variants { get; set; } = [];
    public IReadOnlyList<ProductMediaDto> MediaItems { get; set; } = [];

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public class ProductVariantDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string? ColorTr { get; set; }
    public string? SwatchHex { get; set; }

    /// <summary>Resolved selling price: variant override, else the product's price.</summary>
    public decimal Price { get; set; }

    public decimal? PriceOverride { get; set; }
    public int Stock { get; set; }
    public int LowStockThreshold { get; set; }
    public bool IsActive { get; set; }
}

public class ProductMediaDto
{
    public int Id { get; set; }
    public string ImagePath { get; set; } = string.Empty;
    public string Alt { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsPrimary { get; set; }
}

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameTr { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? DescriptionTr { get; set; }
    public string? Image { get; set; }
    public int SortOrder { get; set; }
    public int Count { get; set; }
}

/// <summary>Query envelope for the public catalog listing.</summary>
public class ProductQuery
{
    public string? Category { get; set; }
    public string? Search { get; set; }

    /// <summary>One of <c>featured</c>, <c>newest</c>, <c>price-low</c>, <c>price-high</c>, <c>name</c>.</summary>
    public string? Sort { get; set; }

    public bool? IsFeatured { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;

    /// <summary>Admin-only: include products deactivated on the storefront.</summary>
    public bool IncludeInactive { get; set; }
}
