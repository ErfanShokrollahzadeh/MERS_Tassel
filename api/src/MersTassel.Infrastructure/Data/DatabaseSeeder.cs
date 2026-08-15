using System.Security.Cryptography;
using MersTassel.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MersTassel.Infrastructure.Data;

/// <summary>
/// Applies migrations then fills an empty database with the launch catalog, an administrator
/// and the storefront's default copy. Idempotent: every step checks before it writes, so a
/// restart never duplicates rows.
/// </summary>
public class DatabaseSeeder(
    AppDbContext db,
    UserManager<AppUser> userManager,
    RoleManager<AppRole> roleManager,
    IConfiguration configuration,
    ILogger<DatabaseSeeder> logger)
{
    public async Task RunAsync(string webRootPath, string seedAssetsPath, CancellationToken ct = default)
    {
        await db.Database.MigrateAsync(ct);

        await SeedRolesAsync();
        await SeedAdminAsync();
        await SeedSettingsAsync(webRootPath, seedAssetsPath, ct);
        await SeedCatalogAsync(webRootPath, seedAssetsPath, ct);
    }

    private async Task SeedRolesAsync()
    {
        foreach (var role in RoleNames.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new AppRole(role));
        }
    }

    private async Task SeedAdminAsync()
    {
        var email = configuration["Seed:AdminEmail"] ?? "admin@merstassel.local";
        if (await userManager.FindByEmailAsync(email) is not null) return;

        // A configured password is honoured; otherwise generate one and print it exactly once.
        var configured = configuration["Seed:AdminPassword"];
        var password = string.IsNullOrWhiteSpace(configured) ? GeneratePassword() : configured;

        var admin = new AppUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            FirstName = "Atelier",
            LastName = "Administrator",
        };

        var result = await userManager.CreateAsync(admin, password);
        if (!result.Succeeded)
        {
            logger.LogError("Could not seed the administrator: {Errors}",
                string.Join("; ", result.Errors.Select(e => e.Description)));
            return;
        }

        await userManager.AddToRoleAsync(admin, RoleNames.Admin);

        if (string.IsNullOrWhiteSpace(configured))
        {
            logger.LogWarning(
                "\n══════════════════════════════════════════════════════════\n" +
                "  Administrator account created\n" +
                "    email:    {Email}\n" +
                "    password: {Password}\n" +
                "  This password is shown once. Store it now, or set\n" +
                "  Seed:AdminPassword to choose your own.\n" +
                "══════════════════════════════════════════════════════════",
                email, password);
        }
        else
        {
            logger.LogInformation("Administrator {Email} created with the configured password.", email);
        }
    }

    /// <summary>Random password that satisfies the configured Identity complexity rules.</summary>
    private static string GeneratePassword()
    {
        const string upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const string lower = "abcdefghijkmnopqrstuvwxyz";
        const string digits = "23456789";
        const string symbols = "!@#$%^&*-_";
        var all = upper + lower + digits + symbols;

        var chars = new List<char>
        {
            upper[RandomNumberGenerator.GetInt32(upper.Length)],
            lower[RandomNumberGenerator.GetInt32(lower.Length)],
            digits[RandomNumberGenerator.GetInt32(digits.Length)],
            symbols[RandomNumberGenerator.GetInt32(symbols.Length)],
        };

        while (chars.Count < 20) chars.Add(all[RandomNumberGenerator.GetInt32(all.Length)]);

        // Shuffle so the guaranteed characters are not always in the first four positions.
        for (var i = chars.Count - 1; i > 0; i--)
        {
            var j = RandomNumberGenerator.GetInt32(i + 1);
            (chars[i], chars[j]) = (chars[j], chars[i]);
        }

        return new string(chars.ToArray());
    }

    private async Task SeedSettingsAsync(string webRootPath, string seedAssetsPath, CancellationToken ct)
    {
        if (await db.SiteSettings.AnyAsync(ct)) return;

        db.SiteSettings.Add(new SiteSettings
        {
            SiteName = "MERS Tassel",
            HeroEyebrow = "Handmade in Istanbul",
            HeroEyebrowTr = "İstanbul'da el yapımı",
            HeroHeadline = "Pieces made to be",
            HeroHeadlineTr = "Yanında taşımak için",
            HeroSubheadline = "Small-batch tassels, pearls and hand-knotted silk, finished one piece at a time in our atelier.",
            HeroSubheadlineTr = "Küçük partiler hâlinde püskül, inci ve elde düğümlenmiş ipek; atölyemizde tek tek tamamlanır.",
            HeroImagePath = CopySeedImage("pearl", "branding", webRootPath, seedAssetsPath),
            ContactEmail = "atelier@merstassel.com",
            ContactPhone = "+90 212 000 00 00",
            ContactAddress = "Karaköy, Istanbul, Türkiye",
            InstagramUrl = "https://instagram.com",
            PinterestUrl = "https://pinterest.com",
            AboutHeadline = "Slow work, kept close",
            AboutHeadlineTr = "Yavaş işçilik, hep yakında",
            AboutBody = "Every MERS Tassel piece begins on the same worktable in Karaköy. We choose materials that age well, knot them by hand, and finish each one only when it feels right to wear.",
            AboutBodyTr = "Her MERS Tassel parçası Karaköy'deki aynı çalışma masasında başlar. İyi yaşlanan malzemeleri seçer, elde düğümler ve her birini ancak takılmaya hazır hissettiğinde tamamlarız.",
        });

        await db.SaveChangesAsync(ct);
    }

    private async Task SeedCatalogAsync(string webRootPath, string seedAssetsPath, CancellationToken ct)
    {
        if (await db.Products.AnyAsync(ct)) return;

        logger.LogInformation("Seeding the launch catalog…");

        var categories = new[]
        {
            new Category { Name = "Necklaces", NameTr = "Kolyeler", Slug = "necklaces", SortOrder = 0, Description = "Hand-knotted necklaces built around pearls, silk and vermeil.", DescriptionTr = "İnci, ipek ve vermeil çevresinde elde düğümlenmiş kolyeler." },
            new Category { Name = "Pendants", NameTr = "Kolye uçları", Slug = "pendants", SortOrder = 1, Description = "Sculptural pendants cut to gather the light.", DescriptionTr = "Işığı toplamak için kesilmiş heykelsi kolye uçları." },
            new Category { Name = "Earrings", NameTr = "Küpeler", Slug = "earrings", SortOrder = 2, Description = "Light-catching earrings balanced for all-day wear.", DescriptionTr = "Gün boyu rahat kullanım için dengelenmiş, ışığı yakalayan küpeler." },
            new Category { Name = "Rings", NameTr = "Yüzükler", Slug = "rings", SortOrder = 3, Description = "Softly sculpted rings finished by hand.", DescriptionTr = "Elde tamamlanan, yumuşak hatlı yüzükler." },
            new Category { Name = "Bracelets", NameTr = "Bileklikler", Slug = "bracelets", SortOrder = 4, Description = "Fluid chains and modern talismans.", DescriptionTr = "Akışkan zincirler ve modern tılsımlar." },
            new Category { Name = "Bag charms", NameTr = "Çanta aksesuarları", Slug = "bag-charms", SortOrder = 5, Description = "Small tactile objects for bags and keys.", DescriptionTr = "Çantalar ve anahtarlar için küçük dokunsal nesneler." },
        };

        db.Categories.AddRange(categories);
        await db.SaveChangesAsync(ct);

        var bySlug = categories.ToDictionary(c => c.Slug);

        foreach (var seed in CatalogSeedData.Products)
        {
            var product = new Product
            {
                Name = seed.Name,
                NameTr = seed.NameTr,
                Slug = seed.Slug,
                CategoryId = bySlug[seed.CategorySlug].Id,
                Description = seed.Description,
                DescriptionTr = seed.DescriptionTr,
                Story = seed.Story,
                StoryTr = seed.StoryTr,
                Material = seed.Material,
                MaterialTr = seed.MaterialTr,
                Dimensions = seed.Dimensions,
                DimensionsTr = seed.DimensionsTr,
                Price = seed.Price,
                CompareAtPrice = seed.CompareAt,
                Currency = "USD",
                Sku = $"MT-{seed.Slug.ToUpperInvariant()}",
                Rating = seed.Rating,
                ReviewCount = seed.Reviews,
                IsFeatured = seed.IsFeatured,
                IsNew = seed.IsNew,
                IsActive = true,
                SeoTitle = $"{seed.Name} · MERS Tassel",
                MetaDescription = seed.Description.Length > 160 ? seed.Description[..160] : seed.Description,
            };

            var order = 0;
            foreach (var (color, colorTr, hex) in seed.Colors)
            {
                product.Variants.Add(new ProductVariant
                {
                    Title = color,
                    Sku = $"MT-{seed.Slug.ToUpperInvariant()}-{Services.CatalogMapping.Slugify(color).ToUpperInvariant()}",
                    Color = color,
                    ColorTr = colorTr,
                    SwatchHex = hex,
                    // Spread the listed stock across finishes, giving the remainder to the first.
                    Stock = seed.Stock / seed.Colors.Count + (order == 0 ? seed.Stock % seed.Colors.Count : 0),
                    LowStockThreshold = 5,
                    IsActive = true,
                });
                order++;
            }

            var sortOrder = 0;
            foreach (var asset in seed.Images)
            {
                var path = CopySeedImage(asset, "products", webRootPath, seedAssetsPath);
                if (path is null) continue;

                product.Media.Add(new ProductMedia
                {
                    ImagePath = path,
                    Alt = seed.Name,
                    SortOrder = sortOrder,
                    IsPrimary = sortOrder == 0,
                });
                sortOrder++;
            }

            db.Products.Add(product);
        }

        await db.SaveChangesAsync(ct);

        // Give each category the hero image of one of its own products.
        foreach (var category in categories)
        {
            var image = await db.ProductMedia
                .Where(m => m.Product.CategoryId == category.Id && m.IsPrimary)
                .Select(m => m.ImagePath)
                .FirstOrDefaultAsync(ct);

            if (image is not null) category.ImagePath = image;
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Seeded {Products} products across {Categories} categories.",
            CatalogSeedData.Products.Count, categories.Length);
    }

    /// <summary>
    /// Copies a committed seed image into the uploads tree and returns its public path, so
    /// seeded products are served from local storage exactly like admin-uploaded ones.
    /// </summary>
    private string? CopySeedImage(string assetName, string entity, string webRootPath, string seedAssetsPath)
    {
        var source = Path.Combine(seedAssetsPath, $"{assetName}.jpg");
        if (!File.Exists(source))
        {
            logger.LogWarning("Seed image {Asset} is missing at {Path}", assetName, source);
            return null;
        }

        var now = DateTimeOffset.UtcNow;
        var relativeDir = Path.Combine("uploads", entity, now.ToString("yyyy"), now.ToString("MM"));
        var absoluteDir = Path.Combine(webRootPath, relativeDir);
        Directory.CreateDirectory(absoluteDir);

        var fileName = $"{Guid.NewGuid():N}.jpg";
        File.Copy(source, Path.Combine(absoluteDir, fileName), overwrite: true);

        return $"/uploads/{entity}/{now:yyyy}/{now:MM}/{fileName}";
    }
}
