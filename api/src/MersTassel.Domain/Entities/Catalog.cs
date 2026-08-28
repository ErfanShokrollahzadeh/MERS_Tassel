using MersTassel.Domain.Common;

namespace MersTassel.Domain.Entities;

public class Category : SoftDeletableEntity
{
    public string Name { get; set; } = string.Empty;

    /// <summary>Turkish display name. Stored per-row so admin-created categories can be localized.</summary>
    public string? NameTr { get; set; }

    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? DescriptionTr { get; set; }

    /// <summary>Relative path such as <c>/uploads/categories/2026/08/{guid}.webp</c>.</summary>
    public string? ImagePath { get; set; }

    public int SortOrder { get; set; }

    public ICollection<Product> Products { get; set; } = new List<Product>();
}

public class Product : SoftDeletableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? NameTr { get; set; }
    public string Slug { get; set; } = string.Empty;

    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public string Description { get; set; } = string.Empty;
    public string? DescriptionTr { get; set; }
    public string Story { get; set; } = string.Empty;
    public string? StoryTr { get; set; }
    public string Material { get; set; } = string.Empty;
    public string? MaterialTr { get; set; }
    public string Dimensions { get; set; } = string.Empty;
    public string? DimensionsTr { get; set; }

    public decimal Price { get; set; }

    /// <summary>Struck-through reference price. Null when the piece is not on sale.</summary>
    public decimal? CompareAtPrice { get; set; }

    public string Currency { get; set; } = "TRY";
    public string Sku { get; set; } = string.Empty;

    public double Rating { get; set; }
    public int ReviewCount { get; set; }

    public bool IsFeatured { get; set; }
    public bool IsNew { get; set; }
    public bool IsActive { get; set; } = true;

    public string SeoTitle { get; set; } = string.Empty;
    public string MetaDescription { get; set; } = string.Empty;

    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    public ICollection<ProductMedia> Media { get; set; } = new List<ProductMedia>();
}

public class ProductVariant : SoftDeletableEntity
{
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;

    public string Color { get; set; } = string.Empty;
    public string? ColorTr { get; set; }

    /// <summary>Swatch colour rendered on the product page, e.g. <c>#bd9057</c>.</summary>
    public string? SwatchHex { get; set; }

    public decimal? PriceOverride { get; set; }
    public int Stock { get; set; }
    public int LowStockThreshold { get; set; } = 5;
    public bool IsActive { get; set; } = true;
}

public class ProductMedia : SoftDeletableEntity
{
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public string ImagePath { get; set; } = string.Empty;
    public string Alt { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsPrimary { get; set; }
}
