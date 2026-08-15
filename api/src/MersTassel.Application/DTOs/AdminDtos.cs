namespace MersTassel.Application.DTOs;

/// <summary>
/// Create/update payload for a product. Bound from <c>multipart/form-data</c> so images can
/// ride along with the fields in a single request.
/// </summary>
public class ProductWriteRequest
{
    public string Name { get; set; } = string.Empty;
    public string? NameTr { get; set; }

    /// <summary>Optional. Generated from <see cref="Name"/> when blank.</summary>
    public string? Slug { get; set; }

    public int CategoryId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? DescriptionTr { get; set; }
    public string Story { get; set; } = string.Empty;
    public string? StoryTr { get; set; }
    public string Material { get; set; } = string.Empty;
    public string? MaterialTr { get; set; }
    public string Dimensions { get; set; } = string.Empty;
    public string? DimensionsTr { get; set; }

    public decimal Price { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public string Currency { get; set; } = "USD";
    public string? Sku { get; set; }

    public bool IsFeatured { get; set; }
    public bool IsNew { get; set; }
    public bool IsActive { get; set; } = true;

    public string SeoTitle { get; set; } = string.Empty;
    public string MetaDescription { get; set; } = string.Empty;

    /// <summary>
    /// Variants serialized as JSON, because multipart form fields are flat strings.
    /// Existing variants are matched by <c>id</c>; omitted ones are soft-deleted.
    /// </summary>
    public string? VariantsJson { get; set; }
}

public class VariantWriteModel
{
    public int? Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Sku { get; set; }
    public string Color { get; set; } = string.Empty;
    public string? ColorTr { get; set; }
    public string? SwatchHex { get; set; }
    public decimal? PriceOverride { get; set; }
    public int Stock { get; set; }
    public int LowStockThreshold { get; set; } = 5;
    public bool IsActive { get; set; } = true;
}

public class CategoryWriteRequest
{
    public string Name { get; set; } = string.Empty;
    public string? NameTr { get; set; }
    public string? Slug { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? DescriptionTr { get; set; }
    public int SortOrder { get; set; }
}

public class SiteSettingsDto
{
    public string SiteName { get; set; } = string.Empty;
    public string? LogoPath { get; set; }
    public string HeroEyebrow { get; set; } = string.Empty;
    public string? HeroEyebrowTr { get; set; }
    public string HeroHeadline { get; set; } = string.Empty;
    public string? HeroHeadlineTr { get; set; }
    public string HeroSubheadline { get; set; } = string.Empty;
    public string? HeroSubheadlineTr { get; set; }
    public string? HeroImagePath { get; set; }
    public string ContactEmail { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string ContactAddress { get; set; } = string.Empty;
    public string? InstagramUrl { get; set; }
    public string? PinterestUrl { get; set; }
    public string AboutHeadline { get; set; } = string.Empty;
    public string? AboutHeadlineTr { get; set; }
    public string AboutBody { get; set; } = string.Empty;
    public string? AboutBodyTr { get; set; }
}

/// <summary>Everything the admin overview renders — all of it derived from real orders.</summary>
public class DashboardDto
{
    public decimal NetRevenue { get; set; }
    public decimal RevenueChangePct { get; set; }
    public int OrderCount { get; set; }
    public decimal OrderChangePct { get; set; }
    public decimal AverageOrderValue { get; set; }
    public decimal AovChangePct { get; set; }
    public int CustomerCount { get; set; }
    public decimal ReturningCustomerPct { get; set; }

    public int ActiveProducts { get; set; }
    public int LowStockCount { get; set; }
    public int OutOfStockCount { get; set; }
    public decimal InventoryValue { get; set; }

    public IReadOnlyList<RevenuePointDto> RevenueSeries { get; set; } = [];
    public IReadOnlyList<OrderDto> RecentOrders { get; set; } = [];
    public IReadOnlyList<TopProductDto> TopProducts { get; set; } = [];
}

public record RevenuePointDto(string Name, string Date, decimal Revenue, int Orders);

public class TopProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Image { get; set; }
    public int UnitsSold { get; set; }
    public decimal Revenue { get; set; }
    public decimal Price { get; set; }
}

public class MediaReorderRequest
{
    /// <summary>Media ids in the order they should appear; the first becomes primary.</summary>
    public List<int> MediaIds { get; set; } = [];
}
