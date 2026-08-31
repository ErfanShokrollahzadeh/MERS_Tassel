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

public class PopupWriteRequest
{
    public string Name { get; set; } = string.Empty;
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

public class TrackPopupEventRequest
{
    public string EventType { get; set; } = "impression";
}
