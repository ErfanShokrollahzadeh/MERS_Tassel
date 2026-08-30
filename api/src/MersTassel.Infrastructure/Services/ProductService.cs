using System.Text.Json;
using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MersTassel.Infrastructure.Services;

public class ProductService(AppDbContext db, IFileStorageService storage, IProductModelStorageService modelStorage) : IProductService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private IQueryable<Product> BaseQuery() => db.Products
        .Include(p => p.Category)
        .Include(p => p.Variants)
        .Include(p => p.Media)
        .Include(p => p.ModelAssets);

    public async Task<PagedResult<ProductDto>> ListAsync(ProductQuery query, CancellationToken ct = default)
    {
        var q = BaseQuery();

        if (!query.IncludeInactive) q = q.Where(p => p.IsActive);
        if (query.IsFeatured == true) q = q.Where(p => p.IsFeatured);

        if (!string.IsNullOrWhiteSpace(query.Category))
            q = q.Where(p => p.Category.Slug == query.Category);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            q = q.Where(p =>
                EF.Functions.Like(p.Name, $"%{term}%") ||
                EF.Functions.Like(p.Description, $"%{term}%") ||
                EF.Functions.Like(p.Category.Name, $"%{term}%") ||
                (p.NameTr != null && EF.Functions.Like(p.NameTr, $"%{term}%")) ||
                (p.DescriptionTr != null && EF.Functions.Like(p.DescriptionTr, $"%{term}%")) ||
                (p.MaterialTr != null && EF.Functions.Like(p.MaterialTr, $"%{term}%")) ||
                (p.Category.NameTr != null && EF.Functions.Like(p.Category.NameTr, $"%{term}%")));
        }

        q = query.Sort switch
        {
            "price-low" => q.OrderBy(p => p.Price),
            "price-high" => q.OrderByDescending(p => p.Price),
            "newest" => q.OrderByDescending(p => p.IsNew).ThenByDescending(p => p.CreatedAt),
            "name" => q.OrderBy(p => p.Name),
            _ => q.OrderByDescending(p => p.IsFeatured).ThenByDescending(p => p.CreatedAt),
        };

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).AsSplitQuery().ToListAsync(ct);

        return new PagedResult<ProductDto>(items.Select(p => p.ToDto()).ToList(), page, pageSize, total);
    }

    public async Task<IReadOnlyList<ProductDto>> FeaturedAsync(int take, CancellationToken ct = default)
    {
        var items = await BaseQuery()
            .Where(p => p.IsActive && p.IsFeatured)
            .OrderByDescending(p => p.CreatedAt)
            .Take(take)
            .AsSplitQuery()
            .ToListAsync(ct);

        return items.Select(p => p.ToDto()).ToList();
    }

    public async Task<ProductDto> GetBySlugAsync(string slug, CancellationToken ct = default)
    {
        var product = await BaseQuery().AsSplitQuery().FirstOrDefaultAsync(p => p.Slug == slug && p.IsActive, ct)
            ?? throw new NotFoundException($"No product found for '{slug}'.");
        return product.ToDto();
    }

    public async Task<ProductDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var product = await BaseQuery().AsSplitQuery().FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new NotFoundException($"No product found with id {id}.");
        return product.ToDto();
    }

    public async Task<IReadOnlyList<ProductDto>> RelatedAsync(string slug, int take, CancellationToken ct = default)
    {
        var product = await db.Products.FirstOrDefaultAsync(p => p.Slug == slug, ct)
            ?? throw new NotFoundException($"No product found for '{slug}'.");

        // Prefer same-category pieces, then backfill with anything else so the rail is never short.
        var sameCategory = await BaseQuery()
            .Where(p => p.IsActive && p.Id != product.Id && p.CategoryId == product.CategoryId)
            .OrderByDescending(p => p.IsFeatured)
            .Take(take)
            .AsSplitQuery()
            .ToListAsync(ct);

        if (sameCategory.Count < take)
        {
            var excluded = sameCategory.Select(p => p.Id).Append(product.Id).ToList();
            var filler = await BaseQuery()
                .Where(p => p.IsActive && !excluded.Contains(p.Id))
                .OrderByDescending(p => p.IsFeatured)
                .Take(take - sameCategory.Count)
                .AsSplitQuery()
                .ToListAsync(ct);
            sameCategory.AddRange(filler);
        }

        return sameCategory.Select(p => p.ToDto()).ToList();
    }

    public async Task<ProductDto> CreateAsync(ProductWriteRequest request, IReadOnlyList<UploadedFile> images, CancellationToken ct = default)
    {
        var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == request.CategoryId, ct)
            ?? throw new ValidationException(nameof(request.CategoryId), "That category does not exist.");

        var slug = await UniqueSlugAsync(request.Slug, request.Name, null, ct);

        var product = new Product
        {
            Name = request.Name.Trim(),
            NameTr = Trim(request.NameTr),
            Slug = slug,
            CategoryId = category.Id,
            Description = request.Description.Trim(),
            DescriptionTr = Trim(request.DescriptionTr),
            Story = request.Story?.Trim() ?? string.Empty,
            StoryTr = Trim(request.StoryTr),
            Material = request.Material?.Trim() ?? string.Empty,
            MaterialTr = Trim(request.MaterialTr),
            Dimensions = request.Dimensions?.Trim() ?? string.Empty,
            DimensionsTr = Trim(request.DimensionsTr),
            Price = request.Price,
            CompareAtPrice = request.CompareAtPrice,
            Currency = "TRY",
            Sku = string.IsNullOrWhiteSpace(request.Sku) ? GenerateSku(slug) : request.Sku.Trim(),
            IsFeatured = request.IsFeatured,
            IsNew = request.IsNew,
            IsActive = request.IsActive,
            SeoTitle = request.SeoTitle ?? string.Empty,
            MetaDescription = request.MetaDescription ?? string.Empty,
        };

        db.Products.Add(product);
        await db.SaveChangesAsync(ct);

        await ApplyVariantsAsync(product, request.VariantsJson, ct);
        await AttachImagesAsync(product, images, ct);
        await db.SaveChangesAsync(ct);

        return await GetByIdAsync(product.Id, ct);
    }

    public async Task<ProductDto> UpdateAsync(int id, ProductWriteRequest request, IReadOnlyList<UploadedFile> images, CancellationToken ct = default)
    {
        var product = await db.Products
            .Include(p => p.Variants)
            .Include(p => p.Media)
            .Include(p => p.ModelAssets)
            .FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new NotFoundException($"No product found with id {id}.");

        if (request.CategoryId != product.CategoryId)
        {
            var exists = await db.Categories.AnyAsync(c => c.Id == request.CategoryId, ct);
            if (!exists) throw new ValidationException(nameof(request.CategoryId), "That category does not exist.");
            product.CategoryId = request.CategoryId;
        }

        product.Name = request.Name.Trim();
        product.NameTr = Trim(request.NameTr);
        product.Slug = await UniqueSlugAsync(request.Slug, request.Name, product.Id, ct);
        product.Description = request.Description.Trim();
        product.DescriptionTr = Trim(request.DescriptionTr);
        product.Story = request.Story?.Trim() ?? string.Empty;
        product.StoryTr = Trim(request.StoryTr);
        product.Material = request.Material?.Trim() ?? string.Empty;
        product.MaterialTr = Trim(request.MaterialTr);
        product.Dimensions = request.Dimensions?.Trim() ?? string.Empty;
        product.DimensionsTr = Trim(request.DimensionsTr);
        product.Price = request.Price;
        product.CompareAtPrice = request.CompareAtPrice;
        product.Currency = "TRY";
        if (!string.IsNullOrWhiteSpace(request.Sku)) product.Sku = request.Sku.Trim();
        product.IsFeatured = request.IsFeatured;
        product.IsNew = request.IsNew;
        product.IsActive = request.IsActive;
        product.SeoTitle = request.SeoTitle ?? string.Empty;
        product.MetaDescription = request.MetaDescription ?? string.Empty;

        await ApplyVariantsAsync(product, request.VariantsJson, ct);

        // No files in this request means "leave the existing gallery alone" — the admin edited
        // text only, and re-uploading unchanged images would be wasteful and lossy.
        await AttachImagesAsync(product, images, ct);

        await db.SaveChangesAsync(ct);
        return await GetByIdAsync(product.Id, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var product = await db.Products
            .Include(p => p.Variants)
            .Include(p => p.Media)
            .Include(p => p.ModelAssets)
            .FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new NotFoundException($"No product found with id {id}.");

        // Soft delete only: order history references these rows, and the files stay on disk
        // so a restore is possible.
        var now = DateTimeOffset.UtcNow;
        product.IsDelete = true;
        product.DeletedAt = now;
        foreach (var variant in product.Variants) { variant.IsDelete = true; variant.DeletedAt = now; }
        foreach (var media in product.Media) { media.IsDelete = true; media.DeletedAt = now; }
        foreach (var model in product.ModelAssets) { model.IsDelete = true; model.DeletedAt = now; }

        await db.SaveChangesAsync(ct);
    }

    public async Task<ProductDto> AddMediaAsync(int productId, IReadOnlyList<UploadedFile> images, CancellationToken ct = default)
    {
        var product = await db.Products.Include(p => p.Media).FirstOrDefaultAsync(p => p.Id == productId, ct)
            ?? throw new NotFoundException($"No product found with id {productId}.");

        if (images.Count == 0) throw new ValidationException("images", "Select at least one image to upload.");

        await AttachImagesAsync(product, images, ct);
        await db.SaveChangesAsync(ct);
        return await GetByIdAsync(productId, ct);
    }

    public async Task<ProductDto> RemoveMediaAsync(int productId, int mediaId, CancellationToken ct = default)
    {
        var product = await db.Products.Include(p => p.Media).FirstOrDefaultAsync(p => p.Id == productId, ct)
            ?? throw new NotFoundException($"No product found with id {productId}.");

        var media = product.Media.FirstOrDefault(m => m.Id == mediaId && !m.IsDelete)
            ?? throw new NotFoundException($"No image found with id {mediaId} on this product.");

        var path = media.ImagePath;
        media.IsDelete = true;
        media.DeletedAt = DateTimeOffset.UtcNow;

        // Promote the next image so the product never loses its primary.
        if (media.IsPrimary)
        {
            var next = product.Media.Where(m => !m.IsDelete && m.Id != mediaId)
                .OrderBy(m => m.SortOrder).ThenBy(m => m.Id).FirstOrDefault();
            if (next is not null) next.IsPrimary = true;
        }

        await db.SaveChangesAsync(ct);

        // Delete the file only after the row is committed, so a failed save cannot orphan it.
        await storage.DeleteAsync(path, ct);

        return await GetByIdAsync(productId, ct);
    }

    public async Task<ProductDto> ReorderMediaAsync(int productId, IReadOnlyList<int> mediaIds, CancellationToken ct = default)
    {
        var product = await db.Products.Include(p => p.Media).FirstOrDefaultAsync(p => p.Id == productId, ct)
            ?? throw new NotFoundException($"No product found with id {productId}.");

        var live = product.Media.Where(m => !m.IsDelete).ToDictionary(m => m.Id);
        var order = 0;

        foreach (var id in mediaIds)
        {
            if (!live.TryGetValue(id, out var media)) continue;
            media.SortOrder = order;
            media.IsPrimary = order == 0;
            order++;
        }

        // Anything the client did not mention keeps a stable position after the named ones.
        foreach (var media in live.Values.Where(m => !mediaIds.Contains(m.Id)).OrderBy(m => m.SortOrder))
        {
            media.SortOrder = order++;
            media.IsPrimary = false;
        }

        await db.SaveChangesAsync(ct);
        return await GetByIdAsync(productId, ct);
    }

    public async Task<ProductDto> AddModelAsync(int productId, ProductModelWriteRequest request, UploadedFile glb, UploadedFile? usdz, UploadedFile? poster, CancellationToken ct = default)
    {
        var product = await db.Products
            .Include(p => p.Variants)
            .Include(p => p.ModelAssets)
            .FirstOrDefaultAsync(p => p.Id == productId, ct)
            ?? throw new NotFoundException($"No product found with id {productId}.");

        ValidateModelRequest(product, request);
        if (request.VariantId.HasValue && product.Variants.All(v => v.Id != request.VariantId.Value || v.IsDelete))
            throw new ValidationException(nameof(request.VariantId), "That finish does not belong to this product.");
        if (product.ModelAssets.Any(m => !m.IsDelete && m.VariantId == request.VariantId))
            throw new ConflictException("A 3D model already exists for this product finish.");

        modelStorage.ValidateGlb(glb.Content, glb.FileName, glb.Length);
        if (usdz is not null) modelStorage.ValidateUsdz(usdz.Content, usdz.FileName, usdz.Length);
        var glbPath = await modelStorage.SaveGlbAsync(glb.Content, ct);
        string? usdzPath = null;
        string? posterPath = null;
        try
        {
            if (usdz is not null) usdzPath = await modelStorage.SaveUsdzAsync(usdz.Content, ct);
            if (poster is not null)
            {
                if (poster.Length > 10 * 1024 * 1024) throw new ValidationException("poster", "Poster must be 10 MB or smaller.");
                posterPath = await modelStorage.SavePosterAsync(poster.Content, poster.FileName, ct);
            }

            product.ModelAssets.Add(new ProductModelAsset
            {
                VariantId = request.VariantId,
                GlbPath = glbPath,
                UsdzPath = usdzPath,
                PosterPath = posterPath,
                Alt = request.Alt.Trim(),
                Placement = request.Placement,
                ScaleMode = "fixed",
                WidthMm = request.WidthMm,
                HeightMm = request.HeightMm,
                DepthMm = request.DepthMm,
                // A GLB is enough for inline 3D and Android AR. Keep the asset public while
                // clearly flagging the optional iOS Quick Look enhancement for the admin.
                Status = "ready",
                ValidationMessage = usdzPath is null ? "Add a USDZ file to enable iOS Quick Look." : null,
                GlbBytes = glb.Length,
                UsdzBytes = usdz?.Length,
            });
            await db.SaveChangesAsync(ct);
        }
        catch
        {
            await modelStorage.DeleteAsync(glbPath, ct);
            await modelStorage.DeleteAsync(usdzPath, ct);
            await modelStorage.DeleteAsync(posterPath, ct);
            throw;
        }

        return await GetByIdAsync(productId, ct);
    }

    public async Task<ProductDto> UpdateModelAsync(int productId, int modelId, ProductModelWriteRequest request, UploadedFile? glb, UploadedFile? usdz, UploadedFile? poster, CancellationToken ct = default)
    {
        var product = await db.Products
            .Include(p => p.Variants)
            .Include(p => p.ModelAssets)
            .FirstOrDefaultAsync(p => p.Id == productId, ct)
            ?? throw new NotFoundException($"No product found with id {productId}.");
        var model = product.ModelAssets.FirstOrDefault(m => m.Id == modelId && !m.IsDelete)
            ?? throw new NotFoundException($"No 3D model found with id {modelId}.");

        ValidateModelRequest(product, request);
        if (request.VariantId.HasValue && product.Variants.All(v => v.Id != request.VariantId.Value || v.IsDelete))
            throw new ValidationException(nameof(request.VariantId), "That finish does not belong to this product.");
        if (product.ModelAssets.Any(m => !m.IsDelete && m.Id != modelId && m.VariantId == request.VariantId))
            throw new ConflictException("A 3D model already exists for this product finish.");

        if (glb is not null) modelStorage.ValidateGlb(glb.Content, glb.FileName, glb.Length);
        if (usdz is not null) modelStorage.ValidateUsdz(usdz.Content, usdz.FileName, usdz.Length);

        var oldGlb = model.GlbPath;
        var oldUsdz = model.UsdzPath;
        var oldPoster = model.PosterPath;
        string? newGlb = null;
        string? newUsdz = null;
        string? newPoster = null;
        try
        {
            if (glb is not null) newGlb = await modelStorage.SaveGlbAsync(glb.Content, ct);
            if (usdz is not null) newUsdz = await modelStorage.SaveUsdzAsync(usdz.Content, ct);
            if (poster is not null)
            {
                if (poster.Length > 10 * 1024 * 1024) throw new ValidationException("poster", "Poster must be 10 MB or smaller.");
                newPoster = await modelStorage.SavePosterAsync(poster.Content, poster.FileName, ct);
            }

            model.VariantId = request.VariantId;
            model.GlbPath = newGlb ?? model.GlbPath;
            model.UsdzPath = newUsdz ?? model.UsdzPath;
            model.PosterPath = newPoster ?? model.PosterPath;
            model.Alt = request.Alt.Trim();
            model.Placement = request.Placement;
            model.ScaleMode = "fixed";
            model.WidthMm = request.WidthMm;
            model.HeightMm = request.HeightMm;
            model.DepthMm = request.DepthMm;
            model.Status = "ready";
            model.ValidationMessage = string.IsNullOrWhiteSpace(model.UsdzPath) ? "Add a USDZ file to enable iOS Quick Look." : null;
            if (glb is not null) model.GlbBytes = glb.Length;
            if (usdz is not null) model.UsdzBytes = usdz.Length;
            await db.SaveChangesAsync(ct);
        }
        catch
        {
            await modelStorage.DeleteAsync(newGlb, ct);
            await modelStorage.DeleteAsync(newUsdz, ct);
            await modelStorage.DeleteAsync(newPoster, ct);
            throw;
        }

        if (newGlb is not null && oldGlb != newGlb) await modelStorage.DeleteAsync(oldGlb, ct);
        if (newUsdz is not null && oldUsdz != newUsdz) await modelStorage.DeleteAsync(oldUsdz, ct);
        if (newPoster is not null && oldPoster != newPoster) await modelStorage.DeleteAsync(oldPoster, ct);
        return await GetByIdAsync(productId, ct);
    }

    public async Task<ProductDto> RemoveModelAsync(int productId, int modelId, CancellationToken ct = default)
    {
        var product = await db.Products.Include(p => p.ModelAssets).FirstOrDefaultAsync(p => p.Id == productId, ct)
            ?? throw new NotFoundException($"No product found with id {productId}.");
        var model = product.ModelAssets.FirstOrDefault(m => m.Id == modelId && !m.IsDelete)
            ?? throw new NotFoundException($"No 3D model found with id {modelId}.");
        var paths = new[] { model.GlbPath, model.UsdzPath, model.PosterPath };
        model.IsDelete = true;
        model.DeletedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        foreach (var path in paths) await modelStorage.DeleteAsync(path, ct);
        return await GetByIdAsync(productId, ct);
    }

    private static void ValidateModelRequest(Product product, ProductModelWriteRequest request)
    {
        if (request.ScaleMode != "fixed") throw new ValidationException(nameof(request.ScaleMode), "AR models must use fixed scale.");
        if (request.WidthMm <= 0 || request.HeightMm <= 0 || request.DepthMm <= 0)
            throw new ValidationException("dimensions", "Width, height and depth must be greater than zero.");
    }

    private async Task AttachImagesAsync(Product product, IReadOnlyList<UploadedFile> images, CancellationToken ct)
    {
        if (images.Count == 0) return;

        var existing = product.Media.Where(m => !m.IsDelete).ToList();
        var nextOrder = existing.Count == 0 ? 0 : existing.Max(m => m.SortOrder) + 1;
        var hasPrimary = existing.Any(m => m.IsPrimary);

        foreach (var image in images)
        {
            storage.Validate(image.Content, image.FileName, image.Length);
            var path = await storage.SaveAsync(image.Content, image.FileName, "products", ct);

            product.Media.Add(new ProductMedia
            {
                ImagePath = path,
                Alt = product.Name,
                SortOrder = nextOrder,
                IsPrimary = !hasPrimary && nextOrder == 0,
            });

            if (!hasPrimary && nextOrder == 0) hasPrimary = true;
            nextOrder++;
        }
    }

    /// <summary>
    /// Reconciles the variant set: rows with an id are updated, rows without are created, and
    /// rows the client omitted are soft-deleted. A null payload leaves variants untouched.
    /// </summary>
    private async Task ApplyVariantsAsync(Product product, string? variantsJson, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(variantsJson)) return;

        List<VariantWriteModel>? models;
        try
        {
            models = JsonSerializer.Deserialize<List<VariantWriteModel>>(variantsJson, JsonOptions);
        }
        catch (JsonException)
        {
            throw new ValidationException("variants", "Variants payload is not valid JSON.");
        }

        if (models is null || models.Count == 0) return;

        if (models.Any(m => string.IsNullOrWhiteSpace(m.Color)))
            throw new ValidationException("variants", "Every variant needs a colour.");

        if (models.Any(m => m.Stock < 0))
            throw new ValidationException("variants", "Variant stock cannot be negative.");

        await db.Entry(product).Collection(p => p.Variants).LoadAsync(ct);
        var existing = product.Variants.Where(v => !v.IsDelete).ToList();
        var keptIds = new List<int>();

        foreach (var model in models)
        {
            var variant = model.Id.HasValue ? existing.FirstOrDefault(v => v.Id == model.Id.Value) : null;

            if (variant is null)
            {
                variant = new ProductVariant { ProductId = product.Id };
                product.Variants.Add(variant);
            }

            variant.Title = string.IsNullOrWhiteSpace(model.Title) ? model.Color : model.Title.Trim();
            variant.Color = model.Color.Trim();
            variant.ColorTr = Trim(model.ColorTr);
            variant.SwatchHex = Trim(model.SwatchHex);
            variant.PriceOverride = model.PriceOverride;
            variant.Stock = model.Stock;
            variant.LowStockThreshold = model.LowStockThreshold;
            variant.IsActive = model.IsActive;
            variant.Sku = string.IsNullOrWhiteSpace(model.Sku)
                ? await UniqueVariantSkuAsync(product.Slug, variant.Color, variant.Id, ct)
                : model.Sku.Trim();

            if (variant.Id != 0) keptIds.Add(variant.Id);
        }

        foreach (var orphan in existing.Where(v => !keptIds.Contains(v.Id)))
        {
            orphan.IsDelete = true;
            orphan.DeletedAt = DateTimeOffset.UtcNow;
        }
    }

    private async Task<string> UniqueSlugAsync(string? requested, string name, int? currentId, CancellationToken ct)
    {
        var baseSlug = CatalogMapping.Slugify(string.IsNullOrWhiteSpace(requested) ? name : requested);
        if (string.IsNullOrWhiteSpace(baseSlug)) baseSlug = "product";

        var slug = baseSlug;
        var suffix = 2;

        while (await db.Products.IgnoreQueryFilters()
                   .AnyAsync(p => p.Slug == slug && (currentId == null || p.Id != currentId), ct))
        {
            slug = $"{baseSlug}-{suffix++}";
        }

        return slug;
    }

    private async Task<string> UniqueVariantSkuAsync(string productSlug, string color, int currentId, CancellationToken ct)
    {
        var baseSku = $"{CatalogMapping.Slugify(productSlug)}-{CatalogMapping.Slugify(color)}".ToUpperInvariant();
        if (baseSku.Length > 55) baseSku = baseSku[..55];

        var sku = baseSku;
        var suffix = 2;

        while (await db.ProductVariants.IgnoreQueryFilters()
                   .AnyAsync(v => v.Sku == sku && v.Id != currentId, ct))
        {
            sku = $"{baseSku}-{suffix++}";
        }

        return sku;
    }

    private static string GenerateSku(string slug) =>
        $"MT-{CatalogMapping.Slugify(slug).ToUpperInvariant()}"[..Math.Min(64, CatalogMapping.Slugify(slug).Length + 3)];

    private static string? Trim(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
