using MersTassel.Domain.Common;
using MersTassel.Domain.Enums;

namespace MersTassel.Domain.Entities;

<<<<<<< ours
/// <summary>
/// A storefront popup or banner campaign created and managed by the backoffice team.
/// Supports scheduling, targeting rules, trigger configurations, and telemetry tracking.
/// </summary>
public class Popup : SoftDeletableEntity
{
    public string Name { get; set; } = string.Empty;
    public PopupType Type { get; set; } = PopupType.Promotional;
    public PopupPlacement Placement { get; set; } = PopupPlacement.CenterModal;
    public PopupTriggerType TriggerType { get; set; } = PopupTriggerType.Delay;

    /// <summary>Value for trigger: seconds if Delay, percentage (1-100) if ScrollDepth.</summary>
    public int TriggerValue { get; set; } = 5;

    public PopupTargetAudience TargetAudience { get; set; } = PopupTargetAudience.All;

    /// <summary>Comma-separated paths or glob patterns, e.g. "/, /products/*". Null or "*" matches all pages.</summary>
    public string? TargetPages { get; set; }

    /// <summary>Device targeting: "all", "desktop", "mobile".</summary>
    public string DeviceTarget { get; set; } = "all";

    /// <summary>Days before displaying to the same client again after dismissal (stored client-side).</summary>
    public int CooldownDays { get; set; } = 7;

    /// <summary>Higher priority popups take precedence when multiple campaigns match.</summary>
    public int Priority { get; set; } = 0;

    public bool IsActive { get; set; } = true;
    public DateTimeOffset? StartsAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }

    // Content & Localization
=======
public class Popup : SoftDeletableEntity
{
    public string Name { get; set; } = string.Empty;
    public PopupType Type { get; set; }
    public PopupPlacement Placement { get; set; }
    public PopupTriggerType TriggerType { get; set; }
    public int TriggerValue { get; set; }
    public PopupTargetAudience TargetAudience { get; set; }
    public string? TargetPages { get; set; }
    public string DeviceTarget { get; set; } = "all";
    public int CooldownDays { get; set; } = 7;
    public int Priority { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? StartsAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
>>>>>>> theirs
    public string? Badge { get; set; }
    public string? BadgeTr { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleTr { get; set; }
    public string? Description { get; set; }
    public string? DescriptionTr { get; set; }
    public string? ImagePath { get; set; }
    public string? PrimaryCtaText { get; set; }
    public string? PrimaryCtaTextTr { get; set; }
    public string? PrimaryCtaUrl { get; set; }
    public string? SecondaryCtaText { get; set; }
    public string? SecondaryCtaTextTr { get; set; }
    public string? CouponCode { get; set; }
<<<<<<< ours

    // Telemetry
=======
>>>>>>> theirs
    public long ImpressionCount { get; set; }
    public long ClickCount { get; set; }
    public long ConversionCount { get; set; }
}
