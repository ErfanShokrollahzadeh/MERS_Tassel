using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MersTassel.Infrastructure.Services;

public class SiteSettingsService(AppDbContext db, IFileStorageService storage) : ISiteSettingsService
{
    public async Task<SiteSettingsDto> GetAsync(CancellationToken ct = default)
    {
        var settings = await LoadOrCreateAsync(ct);
        return ToDto(settings);
    }

    public async Task<SiteSettingsDto> UpdateAsync(SiteSettingsDto request, UploadedFile? logo, UploadedFile? hero, CancellationToken ct = default)
    {
        var settings = await LoadOrCreateAsync(ct);

        settings.SiteName = request.SiteName.Trim();
        settings.HeroEyebrow = request.HeroEyebrow ?? string.Empty;
        settings.HeroEyebrowTr = Trim(request.HeroEyebrowTr);
        settings.HeroHeadline = request.HeroHeadline ?? string.Empty;
        settings.HeroHeadlineTr = Trim(request.HeroHeadlineTr);
        settings.HeroSubheadline = request.HeroSubheadline ?? string.Empty;
        settings.HeroSubheadlineTr = Trim(request.HeroSubheadlineTr);
        settings.ContactEmail = request.ContactEmail ?? string.Empty;
        settings.ContactPhone = request.ContactPhone ?? string.Empty;
        settings.ContactAddress = request.ContactAddress ?? string.Empty;
        settings.InstagramUrl = Trim(request.InstagramUrl);
        settings.PinterestUrl = Trim(request.PinterestUrl);
        settings.AboutHeadline = request.AboutHeadline ?? string.Empty;
        settings.AboutHeadlineTr = Trim(request.AboutHeadlineTr);
        settings.AboutBody = request.AboutBody ?? string.Empty;
        settings.AboutBodyTr = Trim(request.AboutBodyTr);

        // Omitting a file means "keep the current image" — the admin edited text only.
        var replaced = new List<string>();

        if (logo is not null)
        {
            storage.Validate(logo.Content, logo.FileName, logo.Length);
            if (settings.LogoPath is not null) replaced.Add(settings.LogoPath);
            settings.LogoPath = await storage.SaveAsync(logo.Content, logo.FileName, "branding", ct);
        }

        if (hero is not null)
        {
            storage.Validate(hero.Content, hero.FileName, hero.Length);
            if (settings.HeroImagePath is not null) replaced.Add(settings.HeroImagePath);
            settings.HeroImagePath = await storage.SaveAsync(hero.Content, hero.FileName, "branding", ct);
        }

        await db.SaveChangesAsync(ct);

        foreach (var path in replaced) await storage.DeleteAsync(path, ct);

        return ToDto(settings);
    }

    private async Task<SiteSettings> LoadOrCreateAsync(CancellationToken ct)
    {
        var settings = await db.SiteSettings.OrderBy(s => s.Id).FirstOrDefaultAsync(ct);
        if (settings is not null) return settings;

        settings = new SiteSettings();
        db.SiteSettings.Add(settings);
        await db.SaveChangesAsync(ct);
        return settings;
    }

    private static SiteSettingsDto ToDto(SiteSettings s) => new()
    {
        SiteName = s.SiteName,
        LogoPath = s.LogoPath,
        HeroEyebrow = s.HeroEyebrow,
        HeroEyebrowTr = s.HeroEyebrowTr,
        HeroHeadline = s.HeroHeadline,
        HeroHeadlineTr = s.HeroHeadlineTr,
        HeroSubheadline = s.HeroSubheadline,
        HeroSubheadlineTr = s.HeroSubheadlineTr,
        HeroImagePath = s.HeroImagePath,
        ContactEmail = s.ContactEmail,
        ContactPhone = s.ContactPhone,
        ContactAddress = s.ContactAddress,
        InstagramUrl = s.InstagramUrl,
        PinterestUrl = s.PinterestUrl,
        AboutHeadline = s.AboutHeadline,
        AboutHeadlineTr = s.AboutHeadlineTr,
        AboutBody = s.AboutBody,
        AboutBodyTr = s.AboutBodyTr,
    };

    private static string? Trim(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
