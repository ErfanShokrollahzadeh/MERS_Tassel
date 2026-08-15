using MersTassel.Application.Common;
using MersTassel.Application.DTOs;
using MersTassel.Application.Interfaces;
using MersTassel.Domain.Entities;
using MersTassel.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MersTassel.Infrastructure.Services;

public class CategoryService(AppDbContext db, IFileStorageService storage) : ICategoryService
{
    public async Task<IReadOnlyList<CategoryDto>> ListAsync(CancellationToken ct = default)
    {
        var rows = await db.Categories
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Name)
            .Select(c => new
            {
                Category = c,
                Count = c.Products.Count(p => !p.IsDelete && p.IsActive),
            })
            .ToListAsync(ct);

        return rows.Select(r => r.Category.ToDto(r.Count)).ToList();
    }

    public async Task<CategoryDto> CreateAsync(CategoryWriteRequest request, UploadedFile? image, CancellationToken ct = default)
    {
        var category = new Category
        {
            Name = request.Name.Trim(),
            NameTr = Trim(request.NameTr),
            Slug = await UniqueSlugAsync(request.Slug, request.Name, null, ct),
            Description = request.Description?.Trim() ?? string.Empty,
            DescriptionTr = Trim(request.DescriptionTr),
            SortOrder = request.SortOrder,
        };

        if (image is not null)
        {
            storage.Validate(image.Content, image.FileName, image.Length);
            category.ImagePath = await storage.SaveAsync(image.Content, image.FileName, "categories", ct);
        }

        db.Categories.Add(category);
        await db.SaveChangesAsync(ct);

        return category.ToDto(0);
    }

    public async Task<CategoryDto> UpdateAsync(int id, CategoryWriteRequest request, UploadedFile? image, CancellationToken ct = default)
    {
        var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new NotFoundException($"No category found with id {id}.");

        category.Name = request.Name.Trim();
        category.NameTr = Trim(request.NameTr);
        category.Slug = await UniqueSlugAsync(request.Slug, request.Name, id, ct);
        category.Description = request.Description?.Trim() ?? string.Empty;
        category.DescriptionTr = Trim(request.DescriptionTr);
        category.SortOrder = request.SortOrder;

        string? replaced = null;
        if (image is not null)
        {
            storage.Validate(image.Content, image.FileName, image.Length);
            replaced = category.ImagePath;
            category.ImagePath = await storage.SaveAsync(image.Content, image.FileName, "categories", ct);
        }

        await db.SaveChangesAsync(ct);

        // Old file goes only after the new path is safely persisted.
        if (replaced is not null) await storage.DeleteAsync(replaced, ct);

        var count = await db.Products.CountAsync(p => p.CategoryId == id && p.IsActive, ct);
        return category.ToDto(count);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new NotFoundException($"No category found with id {id}.");

        // Refuse rather than cascade — silently hiding a category's products would look like data loss.
        var productCount = await db.Products.CountAsync(p => p.CategoryId == id, ct);
        if (productCount > 0)
            throw new ConflictException($"{productCount} product(s) still use this category. Move them first.");

        category.IsDelete = true;
        category.DeletedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private async Task<string> UniqueSlugAsync(string? requested, string name, int? currentId, CancellationToken ct)
    {
        var baseSlug = CatalogMapping.Slugify(string.IsNullOrWhiteSpace(requested) ? name : requested);
        if (string.IsNullOrWhiteSpace(baseSlug)) baseSlug = "category";

        var slug = baseSlug;
        var suffix = 2;

        while (await db.Categories.IgnoreQueryFilters()
                   .AnyAsync(c => c.Slug == slug && (currentId == null || c.Id != currentId), ct))
        {
            slug = $"{baseSlug}-{suffix++}";
        }

        return slug;
    }

    private static string? Trim(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
