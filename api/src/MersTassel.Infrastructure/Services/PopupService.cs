using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Domain.Enums;
using MersTassel.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MersTassel.Infrastructure.Services;

public class PopupService(AppDbContext db, IFileStorageService storage) : IPopupService
{
    public async Task<IReadOnlyList<PopupDto>> GetActivePopupsAsync(
        string? path,
        string? device,
        bool isAuthenticated,
        CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        var normalizedDevice = (device ?? "all").ToLowerInvariant();

        var query = db.Popups.AsNoTracking()
            .Where(x => x.IsActive)
            .Where(x => !x.StartsAt.HasValue || x.StartsAt.Value <= now)
            .Where(x => !x.ExpiresAt.HasValue || x.ExpiresAt.Value > now);

        if (normalizedDevice != "all")
        {
            query = query.Where(x => x.DeviceTarget == "all" || x.DeviceTarget.ToLower() == normalizedDevice);
        }

        if (isAuthenticated)
        {
            query = query.Where(x => x.TargetAudience == PopupTargetAudience.All ||
                                     x.TargetAudience == PopupTargetAudience.RegisteredOnly);
        }
        else
        {
            query = query.Where(x => x.TargetAudience == PopupTargetAudience.All ||
                                     x.TargetAudience == PopupTargetAudience.GuestsOnly);
        }

        var list = await query
            .OrderByDescending(x => x.Priority)
            .ThenByDescending(x => x.CreatedAt)
            .ToListAsync(ct);

        return list.Select(MapToPublicDto).ToList();
    }

    public async Task RecordEventAsync(int popupId, string eventType, CancellationToken ct = default)
    {
        var normalizedEvent = eventType.ToLowerInvariant();
        var popup = await db.Popups.FirstOrDefaultAsync(x => x.Id == popupId, ct);
        if (popup is null) return;

        switch (normalizedEvent)
        {
            case "impression":
                popup.ImpressionCount++;
                break;
            case "click":
                popup.ClickCount++;
                break;
            case "conversion":
                popup.ConversionCount++;
                break;
        }

        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<AdminPopupDto>> ListAdminAsync(CancellationToken ct = default)
    {
        var popups = await db.Popups.AsNoTracking()
            .OrderByDescending(x => x.Priority)
            .ThenByDescending(x => x.CreatedAt)
            .ToListAsync(ct);

        return popups.Select(MapToAdminDto).ToList();
    }

    public async Task<AdminPopupDto> GetAdminByIdAsync(int id, CancellationToken ct = default)
    {
        var popup = await db.Popups.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (popup is null) throw new NotFoundException("Popup campaign not found.");

        return MapToAdminDto(popup);
    }

    public async Task<AdminPopupDto> CreateAsync(
        PopupWriteRequest request,
        UploadedFile? image,
        CancellationToken ct = default)
    {
        string? imagePath = null;
        if (image != null)
        {
            storage.Validate(image.Content, image.FileName, image.Length);
            imagePath = await storage.SaveAsync(image.Content, image.FileName, "popups", ct);
        }

        var popup = new Popup
        {
            Name = request.Name.Trim(),
            Type = ParseEnum(request.Type, PopupType.Promotional),
            Placement = ParseEnum(request.Placement, PopupPlacement.CenterModal),
            TriggerType = ParseEnum(request.TriggerType, PopupTriggerType.Delay),
            TriggerValue = request.TriggerValue,
            TargetAudience = ParseEnum(request.TargetAudience, PopupTargetAudience.All),
            TargetPages = string.IsNullOrWhiteSpace(request.TargetPages) ? null : request.TargetPages.Trim(),
            DeviceTarget = string.IsNullOrWhiteSpace(request.DeviceTarget) ? "all" : request.DeviceTarget.Trim().ToLowerInvariant(),
            CooldownDays = Math.Max(0, request.CooldownDays),
            Priority = request.Priority,
            IsActive = request.IsActive,
            StartsAt = request.StartsAt,
            ExpiresAt = request.ExpiresAt,
            Badge = NullIfEmpty(request.Badge),
            BadgeTr = NullIfEmpty(request.BadgeTr),
            Title = request.Title.Trim(),
            TitleTr = NullIfEmpty(request.TitleTr),
            Description = NullIfEmpty(request.Description),
            DescriptionTr = NullIfEmpty(request.DescriptionTr),
            ImagePath = imagePath,
            PrimaryCtaText = NullIfEmpty(request.PrimaryCtaText),
            PrimaryCtaTextTr = NullIfEmpty(request.PrimaryCtaTextTr),
            PrimaryCtaUrl = NullIfEmpty(request.PrimaryCtaUrl),
            SecondaryCtaText = NullIfEmpty(request.SecondaryCtaText),
            SecondaryCtaTextTr = NullIfEmpty(request.SecondaryCtaTextTr),
            CouponCode = NullIfEmpty(request.CouponCode)?.ToUpperInvariant(),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        db.Popups.Add(popup);
        await db.SaveChangesAsync(ct);

        return MapToAdminDto(popup);
    }

    public async Task<AdminPopupDto> UpdateAsync(
        int id,
        PopupWriteRequest request,
        UploadedFile? image,
        CancellationToken ct = default)
    {
        var popup = await db.Popups.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (popup is null) throw new NotFoundException("Popup campaign not found.");

        if (image != null)
        {
            storage.Validate(image.Content, image.FileName, image.Length);
            var oldImage = popup.ImagePath;
            popup.ImagePath = await storage.SaveAsync(image.Content, image.FileName, "popups", ct);
            if (!string.IsNullOrEmpty(oldImage))
            {
                await storage.DeleteAsync(oldImage, ct);
            }
        }

        popup.Name = request.Name.Trim();
        popup.Type = ParseEnum(request.Type, PopupType.Promotional);
        popup.Placement = ParseEnum(request.Placement, PopupPlacement.CenterModal);
        popup.TriggerType = ParseEnum(request.TriggerType, PopupTriggerType.Delay);
        popup.TriggerValue = request.TriggerValue;
        popup.TargetAudience = ParseEnum(request.TargetAudience, PopupTargetAudience.All);
        popup.TargetPages = string.IsNullOrWhiteSpace(request.TargetPages) ? null : request.TargetPages.Trim();
        popup.DeviceTarget = string.IsNullOrWhiteSpace(request.DeviceTarget) ? "all" : request.DeviceTarget.Trim().ToLowerInvariant();
        popup.CooldownDays = Math.Max(0, request.CooldownDays);
        popup.Priority = request.Priority;
        popup.IsActive = request.IsActive;
        popup.StartsAt = request.StartsAt;
        popup.ExpiresAt = request.ExpiresAt;
        popup.Badge = NullIfEmpty(request.Badge);
        popup.BadgeTr = NullIfEmpty(request.BadgeTr);
        popup.Title = request.Title.Trim();
        popup.TitleTr = NullIfEmpty(request.TitleTr);
        popup.Description = NullIfEmpty(request.Description);
        popup.DescriptionTr = NullIfEmpty(request.DescriptionTr);
        popup.PrimaryCtaText = NullIfEmpty(request.PrimaryCtaText);
        popup.PrimaryCtaTextTr = NullIfEmpty(request.PrimaryCtaTextTr);
        popup.PrimaryCtaUrl = NullIfEmpty(request.PrimaryCtaUrl);
        popup.SecondaryCtaText = NullIfEmpty(request.SecondaryCtaText);
        popup.SecondaryCtaTextTr = NullIfEmpty(request.SecondaryCtaTextTr);
        popup.CouponCode = NullIfEmpty(request.CouponCode)?.ToUpperInvariant();
        popup.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);

        return MapToAdminDto(popup);
    }

    public async Task ToggleStatusAsync(int id, bool isActive, CancellationToken ct = default)
    {
        var popup = await db.Popups.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (popup is null) throw new NotFoundException("Popup campaign not found.");

        popup.IsActive = isActive;
        popup.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var popup = await db.Popups.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (popup is null) throw new NotFoundException("Popup campaign not found.");

        popup.IsDelete = true;
        popup.DeletedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private static PopupDto MapToPublicDto(Popup p) => new()
    {
        Id = p.Id,
        Type = p.Type.ToString().ToLowerInvariant(),
        Placement = ToSnakeCase(p.Placement.ToString()),
        TriggerType = ToSnakeCase(p.TriggerType.ToString()),
        TriggerValue = p.TriggerValue,
        CooldownDays = p.CooldownDays,
        Priority = p.Priority,
        TargetPages = p.TargetPages,
        DeviceTarget = p.DeviceTarget,
        Badge = p.Badge,
        BadgeTr = p.BadgeTr,
        Title = p.Title,
        TitleTr = p.TitleTr,
        Description = p.Description,
        DescriptionTr = p.DescriptionTr,
        ImagePath = p.ImagePath,
        PrimaryCtaText = p.PrimaryCtaText,
        PrimaryCtaTextTr = p.PrimaryCtaTextTr,
        PrimaryCtaUrl = p.PrimaryCtaUrl,
        SecondaryCtaText = p.SecondaryCtaText,
        SecondaryCtaTextTr = p.SecondaryCtaTextTr,
        CouponCode = p.CouponCode,
    };

    private static AdminPopupDto MapToAdminDto(Popup p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Type = p.Type.ToString().ToLowerInvariant(),
        Placement = ToSnakeCase(p.Placement.ToString()),
        TriggerType = ToSnakeCase(p.TriggerType.ToString()),
        TriggerValue = p.TriggerValue,
        TargetAudience = ToSnakeCase(p.TargetAudience.ToString()),
        TargetPages = p.TargetPages,
        DeviceTarget = p.DeviceTarget,
        CooldownDays = p.CooldownDays,
        Priority = p.Priority,
        IsActive = p.IsActive,
        StartsAt = p.StartsAt,
        ExpiresAt = p.ExpiresAt,
        Badge = p.Badge,
        BadgeTr = p.BadgeTr,
        Title = p.Title,
        TitleTr = p.TitleTr,
        Description = p.Description,
        DescriptionTr = p.DescriptionTr,
        ImagePath = p.ImagePath,
        PrimaryCtaText = p.PrimaryCtaText,
        PrimaryCtaTextTr = p.PrimaryCtaTextTr,
        PrimaryCtaUrl = p.PrimaryCtaUrl,
        SecondaryCtaText = p.SecondaryCtaText,
        SecondaryCtaTextTr = p.SecondaryCtaTextTr,
        CouponCode = p.CouponCode,
        ImpressionCount = p.ImpressionCount,
        ClickCount = p.ClickCount,
        ConversionCount = p.ConversionCount,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt,
    };

    private static TEnum ParseEnum<TEnum>(string value, TEnum fallback) where TEnum : struct, Enum
    {
        var cleaned = value.Replace("_", "", StringComparison.OrdinalIgnoreCase);
        return Enum.TryParse<TEnum>(cleaned, true, out var result) ? result : fallback;
    }

    private static string ToSnakeCase(string str)
    {
        if (string.IsNullOrEmpty(str)) return str;
        return string.Concat(str.Select((x, i) => i > 0 && char.IsUpper(x) ? "_" + x.ToString() : x.ToString())).ToLower();
    }

    private static string? NullIfEmpty(string? val) =>
        string.IsNullOrWhiteSpace(val) ? null : val.Trim();
}
