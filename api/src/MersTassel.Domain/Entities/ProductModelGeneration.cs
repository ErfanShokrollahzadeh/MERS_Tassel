using MersTassel.Domain.Common;

namespace MersTassel.Domain.Entities;

/// <summary>
/// Private, review-gated AI reconstruction job. No path on this entity is returned by the
/// public catalog API; approval copies validated output into ProductModelAsset storage.
/// </summary>
public class ProductModelGenerationJob : SoftDeletableEntity
{
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public int? VariantId { get; set; }
    public ProductVariant? Variant { get; set; }
    public string RequestedByUserId { get; set; } = string.Empty;
    public AppUser RequestedByUser { get; set; } = null!;

    public string Provider { get; set; } = "meshy";
    public string? ProviderJobId { get; set; }
    public string CaptureMethod { get; set; } = "photos";
    public string CapturePathsJson { get; set; } = "[]";
    public decimal CalibrationReferenceMm { get; set; }
    public decimal WidthMm { get; set; }
    public decimal HeightMm { get; set; }
    public decimal DepthMm { get; set; }
    public string SupportedPlacements { get; set; } = "floor";
    public string DefaultPlacement { get; set; } = "floor";

    public string Status { get; set; } = ProductModelGenerationStatuses.DraftCapture;
    public int ProgressPercent { get; set; }
    public string Stage { get; set; } = "Waiting for phone capture";
    public string? DraftGlbPath { get; set; }
    public string? DraftPosterPath { get; set; }
    public string? ValidationReportJson { get; set; }
    public string? FailureCode { get; set; }
    public string? FailureMessage { get; set; }

    public string CaptureTokenHash { get; set; } = string.Empty;
    public DateTimeOffset CaptureTokenExpiresAt { get; set; }
    public DateTimeOffset? CaptureTokenUsedAt { get; set; }
    public int? ApprovedModelAssetId { get; set; }
    public ProductModelAsset? ApprovedModelAsset { get; set; }
    public string? ReviewedByUserId { get; set; }
    public AppUser? ReviewedByUser { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
}

public static class ProductModelGenerationStatuses
{
    public const string DraftCapture = "draft_capture";
    public const string Queued = "queued";
    public const string Reconstructing = "reconstructing";
    public const string Optimizing = "optimizing";
    public const string AwaitingReview = "awaiting_review";
    public const string Approved = "approved";
    public const string Failed = "failed";
    public const string Cancelled = "cancelled";
}
