<<<<<<< ours
namespace MersTassel.Application.DTOs;

public class PopupDto
{
    public int Id { get; set; }
    public string Type { get; set; } = "promotional";
    public string Placement { get; set; } = "center_modal";
    public string TriggerType { get; set; } = "delay";
    public int TriggerValue { get; set; } = 5;
    public int CooldownDays { get; set; } = 7;
    public int Priority { get; set; }
    public string? TargetPages { get; set; }
    public string DeviceTarget { get; set; } = "all";

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
}

public class AdminPopupDto : PopupDto
{
    public string Name { get; set; } = string.Empty;
    public string TargetAudience { get; set; } = "all";
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? StartsAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }

    public long ImpressionCount { get; set; }
    public long ClickCount { get; set; }
    public long ConversionCount { get; set; }

    public decimal ClickThroughRate =>
        ImpressionCount > 0 ? Math.Round((decimal)ClickCount / ImpressionCount * 100m, 2) : 0m;

    public decimal ConversionRate =>
        ImpressionCount > 0 ? Math.Round((decimal)ConversionCount / ImpressionCount * 100m, 2) : 0m;

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
=======
using MersTassel.Domain.Enums;

namespace MersTassel.Application.DTOs;

public record PopupDto(int Id, PopupType Type, PopupPlacement Placement, PopupTriggerType TriggerType,
    int TriggerValue, int CooldownDays, string? Badge, string? BadgeTr, string Title, string? TitleTr,
    string? Description, string? DescriptionTr, string? ImagePath, string? PrimaryCtaText,
    string? PrimaryCtaTextTr, string? PrimaryCtaUrl, string? SecondaryCtaText,
    string? SecondaryCtaTextTr, string? CouponCode);

public record AdminPopupDto(int Id, string Name, PopupType Type, PopupPlacement Placement,
    PopupTriggerType TriggerType, int TriggerValue, PopupTargetAudience TargetAudience,
    string? TargetPages, string DeviceTarget, int CooldownDays, int Priority, bool IsActive,
    DateTimeOffset? StartsAt, DateTimeOffset? ExpiresAt, string? Badge, string? BadgeTr, string Title,
    string? TitleTr, string? Description, string? DescriptionTr, string? ImagePath,
    string? PrimaryCtaText, string? PrimaryCtaTextTr, string? PrimaryCtaUrl,
    string? SecondaryCtaText, string? SecondaryCtaTextTr, string? CouponCode,
    long ImpressionCount, long ClickCount, long ConversionCount, decimal Ctr);
>>>>>>> theirs

public class PopupWriteRequest
{
    public string Name { get; set; } = string.Empty;
<<<<<<< ours
    public string Type { get; set; } = "promotional";
    public string Placement { get; set; } = "center_modal";
    public string TriggerType { get; set; } = "delay";
    public int TriggerValue { get; set; } = 5;
    public string TargetAudience { get; set; } = "all";
    public string? TargetPages { get; set; }
    public string DeviceTarget { get; set; } = "all";
    public int CooldownDays { get; set; } = 7;
    public int Priority { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? StartsAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }

=======
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
    public string? PrimaryCtaText { get; set; }
    public string? PrimaryCtaTextTr { get; set; }
    public string? PrimaryCtaUrl { get; set; }
    public string? SecondaryCtaText { get; set; }
    public string? SecondaryCtaTextTr { get; set; }
    public string? CouponCode { get; set; }
}
<<<<<<< ours

public class TrackPopupEventRequest
{
    public string EventType { get; set; } = "impression";
}
=======
public record TrackPopupEventRequest(string EventType);
public record TogglePopupStatusRequest(bool IsActive);
>>>>>>> theirs
