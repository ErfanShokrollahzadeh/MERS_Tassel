using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Domain.Enums;
using MersTassel.Infrastructure.Data;
<<<<<<< ours
=======
using Microsoft.AspNetCore.Http;
>>>>>>> theirs
using Microsoft.EntityFrameworkCore;

namespace MersTassel.Infrastructure.Services;

<<<<<<< ours
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
=======
public class PopupService(AppDbContext db, IFileStorageService files) : IPopupService
{
    public async Task<IReadOnlyList<PopupDto>> GetActivePopupsAsync(string? path, string? device, bool authenticated, CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        var query = db.Popups.AsNoTracking().Where(x => x.IsActive && (!x.StartsAt.HasValue || x.StartsAt <= now) &&
            (!x.ExpiresAt.HasValue || x.ExpiresAt > now));
        query = authenticated ? query.Where(x => x.TargetAudience != PopupTargetAudience.GuestsOnly)
                              : query.Where(x => x.TargetAudience != PopupTargetAudience.RegisteredOnly);
        if (!string.IsNullOrWhiteSpace(device)) query = query.Where(x => x.DeviceTarget == "all" || x.DeviceTarget == device);
        var rows = await query.OrderByDescending(x => x.Priority).ThenBy(x => x.Id).ToListAsync(ct);
        return rows.Where(x => MatchesPath(x.TargetPages, path)).Select(ToPublic).ToList();
    }

    public async Task RecordEventAsync(int id, string eventType, CancellationToken ct)
    {
        var popup = await db.Popups.SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Popup not found.");
        switch (eventType.Trim().ToLowerInvariant())
        {
            case "impression": popup.ImpressionCount++; break;
            case "click": popup.ClickCount++; break;
            case "conversion": popup.ConversionCount++; break;
            default: throw new ValidationException("eventType", "Event type must be impression, click, or conversion.");
        }
        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<AdminPopupDto>> ListAdminAsync(CancellationToken ct) =>
        (await db.Popups.AsNoTracking().OrderByDescending(x => x.Priority).ThenByDescending(x => x.CreatedAt).ToListAsync(ct)).Select(ToAdmin).ToList();

    public async Task<AdminPopupDto> GetAdminByIdAsync(int id, CancellationToken ct) =>
        ToAdmin(await Find(id, ct));

    public async Task<AdminPopupDto> CreateAsync(PopupWriteRequest request, IFormFile? image, CancellationToken ct)
    {
        var popup = new Popup(); Apply(popup, request);
        if (image != null) popup.ImagePath = await SaveImage(image, ct);
        db.Popups.Add(popup); await db.SaveChangesAsync(ct); return ToAdmin(popup);
    }

    public async Task<AdminPopupDto> UpdateAsync(int id, PopupWriteRequest request, IFormFile? image, CancellationToken ct)
    {
        var popup = await Find(id, ct); Apply(popup, request);
        var old = popup.ImagePath;
        if (image != null) popup.ImagePath = await SaveImage(image, ct);
        await db.SaveChangesAsync(ct);
        if (image != null) await files.DeleteAsync(old, ct);
        return ToAdmin(popup);
    }

    public async Task ToggleStatusAsync(int id, bool active, CancellationToken ct) { var popup = await Find(id, ct); popup.IsActive = active; await db.SaveChangesAsync(ct); }
    public async Task DeleteAsync(int id, CancellationToken ct) { var popup = await Find(id, ct); popup.IsDelete = true; popup.DeletedAt = DateTimeOffset.UtcNow; await db.SaveChangesAsync(ct); }

    private async Task<Popup> Find(int id, CancellationToken ct) => await db.Popups.SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Popup not found.");
    private async Task<string> SaveImage(IFormFile image, CancellationToken ct) { using var stream = image.OpenReadStream(); files.Validate(stream, image.FileName, image.Length); return await files.SaveAsync(stream, image.FileName, "popups", ct); }
    private static bool MatchesPath(string? patterns, string? path)
    {
        if (string.IsNullOrWhiteSpace(patterns)) return true;
        path = string.IsNullOrWhiteSpace(path) ? "/" : path.Split('?', '#')[0];
        return patterns.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Any(p => p == "*" || p == path || (p.EndsWith("/*") && path.StartsWith(p[..^1], StringComparison.OrdinalIgnoreCase)));
    }
    private static void Apply(Popup p, PopupWriteRequest r) { p.Name=r.Name.Trim(); p.Type=r.Type; p.Placement=r.Placement; p.TriggerType=r.TriggerType; p.TriggerValue=r.TriggerValue; p.TargetAudience=r.TargetAudience; p.TargetPages=r.TargetPages; p.DeviceTarget=r.DeviceTarget.ToLowerInvariant(); p.CooldownDays=r.CooldownDays; p.Priority=r.Priority; p.IsActive=r.IsActive; p.StartsAt=r.StartsAt; p.ExpiresAt=r.ExpiresAt; p.Badge=r.Badge; p.BadgeTr=r.BadgeTr; p.Title=r.Title; p.TitleTr=r.TitleTr; p.Description=r.Description; p.DescriptionTr=r.DescriptionTr; p.PrimaryCtaText=r.PrimaryCtaText; p.PrimaryCtaTextTr=r.PrimaryCtaTextTr; p.PrimaryCtaUrl=r.PrimaryCtaUrl; p.SecondaryCtaText=r.SecondaryCtaText; p.SecondaryCtaTextTr=r.SecondaryCtaTextTr; p.CouponCode=r.CouponCode; }
    private static PopupDto ToPublic(Popup p) => new(p.Id,p.Type,p.Placement,p.TriggerType,p.TriggerValue,p.CooldownDays,p.Badge,p.BadgeTr,p.Title,p.TitleTr,p.Description,p.DescriptionTr,p.ImagePath,p.PrimaryCtaText,p.PrimaryCtaTextTr,p.PrimaryCtaUrl,p.SecondaryCtaText,p.SecondaryCtaTextTr,p.CouponCode);
    private static AdminPopupDto ToAdmin(Popup p) => new(p.Id,p.Name,p.Type,p.Placement,p.TriggerType,p.TriggerValue,p.TargetAudience,p.TargetPages,p.DeviceTarget,p.CooldownDays,p.Priority,p.IsActive,p.StartsAt,p.ExpiresAt,p.Badge,p.BadgeTr,p.Title,p.TitleTr,p.Description,p.DescriptionTr,p.ImagePath,p.PrimaryCtaText,p.PrimaryCtaTextTr,p.PrimaryCtaUrl,p.SecondaryCtaText,p.SecondaryCtaTextTr,p.CouponCode,p.ImpressionCount,p.ClickCount,p.ConversionCount,p.ImpressionCount == 0 ? 0 : Math.Round((decimal)p.ClickCount / p.ImpressionCount * 100, 2));
>>>>>>> theirs
}
