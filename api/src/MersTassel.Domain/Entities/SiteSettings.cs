using MersTassel.Domain.Common;

namespace MersTassel.Domain.Entities;

/// <summary>
/// Single-row table holding the storefront chrome the admin can edit: logo, hero banner and
/// contact details. Kept as one row rather than a key/value bag so the fields stay typed.
/// </summary>
public class SiteSettings : SoftDeletableEntity
{
    public string SiteName { get; set; } = "MERS Tassel";
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
