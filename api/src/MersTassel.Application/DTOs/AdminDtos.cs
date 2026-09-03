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
    public string Currency { get; set; } = "TRY";
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
    public string? TiktokUrl { get; set; }
    public string? WhatsappPhone { get; set; }
    public string? PinterestUrl { get; set; }
    public string? CrispWebsiteId { get; set; }
    public bool CrispEnabled { get; set; }
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

public class ProductModelWriteRequest
{
    public int? VariantId { get; set; }
    public string Alt { get; set; } = string.Empty;
    public string Placement { get; set; } = "floor";
    public string SupportedPlacements { get; set; } = "floor";
    public string ScaleMode { get; set; } = "fixed";
    public decimal WidthMm { get; set; }
    public decimal HeightMm { get; set; }
    public decimal DepthMm { get; set; }
}

public class CreateModelGenerationJobRequest
{
    public int? VariantId { get; set; }
    public string Provider { get; set; } = "meshy";
}

public class ModelCaptureUploadRequest
{
    public string Token { get; set; } = string.Empty;
    public decimal CalibrationReferenceMm { get; set; }
    public decimal WidthMm { get; set; }
    public decimal HeightMm { get; set; }
    public decimal DepthMm { get; set; }
    public string SupportedPlacements { get; set; } = "floor";
    public string DefaultPlacement { get; set; } = "floor";
}

public class ModelGenerationReviewRequest
{
    public bool ScaleVerified { get; set; }
    public string? Notes { get; set; }
}

public class ModelGenerationRejectRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class ModelGenerationJobDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int? VariantId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int ProgressPercent { get; set; }
    public string Stage { get; set; } = string.Empty;
    public decimal WidthMm { get; set; }
    public decimal HeightMm { get; set; }
    public decimal DepthMm { get; set; }
    public int CaptureCount { get; set; }
    public IReadOnlyList<string> SupportedPlacements { get; set; } = [];
    public string DefaultPlacement { get; set; } = "floor";
    public string? ValidationReportJson { get; set; }
    public string? FailureCode { get; set; }
    public string? FailureMessage { get; set; }
    public bool CanRetry { get; set; }
    public bool CanApprove { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
}

public class ModelCaptureSessionDto
{
    public int JobId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductImage { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
}

public record CreateModelGenerationJobResult(ModelGenerationJobDto Job, string CaptureToken, DateTimeOffset ExpiresAt);
