using System.Security.Cryptography;
using MersTassel.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MersTassel.Infrastructure.Data;

/// <summary>
/// Applies migrations, provisions the administrator and synchronizes the storefront's default
/// catalog/copy. Idempotent: every step checks stable slugs before it writes, so a restart can
/// add a newly released seed category without duplicating existing rows.
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
        await SeedBlogAsync(webRootPath, seedAssetsPath, ct);
    }

    private async Task SeedBlogAsync(string webRootPath, string seedAssetsPath, CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        var seeds = new (BlogPost Post, string AssetName)[]
        {
            (new BlogPost
            {
                Title = "The Patience of the Hand",
                TitleTr = "Elin Sabrı",
                Slug = "the-patience-of-the-hand",
                Category = "Craftsmanship",
                Excerpt = "Inside the quiet rituals that turn a sketch into a lasting piece.",
                ExcerptTr = "Bir eskizi kalıcı bir parçaya dönüştüren sessiz ritüeller.",
                Content = "## Made slowly\n\nEvery MERS piece begins at the workbench. We shape, solder, polish and inspect it by hand, allowing the material to set the pace. The smallest marks are not imperfections; they are evidence of attention and a maker's presence.",
                ContentTr = "## Yavaşça üretildi\n\nHer MERS parçası çalışma tezgâhında başlar. Malzemenin ritmine izin vererek elle şekillendirir, lehimler, parlatır ve inceleriz. En küçük izler kusur değil, özenin ve ustanın varlığının kanıtıdır.",
                ReadingTimeMinutes = 4,
                PublishedAt = now.AddDays(-3),
            }, "studio"),
            (new BlogPost
            {
                Title = "How to Layer a Story",
                TitleTr = "Bir Hikâye Nasıl Katmanlanır",
                Slug = "how-to-layer-a-story",
                Category = "Styling",
                Excerpt = "A considered guide to wearing keepsakes together.",
                ExcerptTr = "Hatıra parçalarını birlikte takmak için özenli bir rehber.",
                Content = "## Begin with memory\n\nChoose one piece with meaning, then let scale and texture guide the others. Leave a little space between chains so every detail catches the light.",
                ContentTr = "## Hatırayla başlayın\n\nAnlam taşıyan bir parçayı seçin; diğerlerine ölçek ve doku rehberlik etsin. Zincirler arasında biraz boşluk bırakın ki her detay ışığı yakalayabilsin.",
                ReadingTimeMinutes = 3,
                PublishedAt = now.AddDays(-6),
            }, "jewelry-detail"),
            (new BlogPost
            {
                Title = "Materials That Soften with Time",
                TitleTr = "Zamanla Yumuşayan Malzemeler",
                Slug = "materials-that-soften-with-time",
                Category = "Materials",
                Excerpt = "Why we choose metals, threads and stones that age alongside you.",
                ExcerptTr = "Neden sizinle birlikte yaş alan metalleri, iplikleri ve taşları seçiyoruz?",
                Content = "## Built to be worn\n\nJewelry is not meant to stay in a drawer. Silver gains warmth from daily wear; natural stones deepen in tone. These pieces are made to be lived with, repaired when needed, and passed on.",
                ContentTr = "## Taşınmak için üretildi\n\nTakı bir çekmecede beklemek için değildir. Gümüş günlük kullanımla sıcaklık kazanır; doğal taşların tonu derinleşir. Bu parçalar yaşanmak, gerektiğinde onarılmak ve devredilmek için tasarlanır.",
                ReadingTimeMinutes = 5,
                PublishedAt = now.AddDays(-10),
            }, "atelier"),
        };

        foreach (var (post, assetName) in seeds)
        {
            var coverPath = CopyNamedSeedImage(assetName, "blog", webRootPath, seedAssetsPath);
            if (existing.TryGetValue(post.Slug, out var current))
            {
                // The first journal release pointed at /uploads/seed without copying files.
                // Repair only that launch placeholder; an administrator's later image wins.
                if (coverPath is not null &&
                    (string.IsNullOrWhiteSpace(current.CoverImagePath) ||
                     current.CoverImagePath.StartsWith("/uploads/seed/", StringComparison.OrdinalIgnoreCase)))
                {
                    current.CoverImagePath = coverPath;
                }

                continue;
            }

            post.CoverImagePath = coverPath;
            db.BlogPosts.Add(post);
        }

        await db.SaveChangesAsync(ct);
=======
        await SeedBlogAsync(ct);
>>>>>>> origin/master
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
        var configured = configuration["Seed:AdminPassword"];
        var resetRequested = bool.TryParse(configuration["Seed:ResetAdminPassword"], out var reset) && reset;
        var existing = await userManager.FindByEmailAsync(email);

        if (existing is not null)
        {
            // The configured address is the operator's recovery anchor. It can safely reclaim
            // workspace access without deleting the database or recreating customer records.
            existing.EmailConfirmed = true;
            existing.IsDelete = false;
            await userManager.UpdateAsync(existing);

            if (!await userManager.IsInRoleAsync(existing, RoleNames.Admin))
            {
                var promoted = await userManager.AddToRoleAsync(existing, RoleNames.Admin);
                if (!promoted.Succeeded)
                {
                    logger.LogError("Could not restore administrator role for {Email}: {Errors}", email,
                        string.Join("; ", promoted.Errors.Select(e => e.Description)));
                }
            }

            if (resetRequested)
            {
                if (string.IsNullOrWhiteSpace(configured))
                {
                    logger.LogError("Seed:ResetAdminPassword is enabled, but Seed:AdminPassword is empty.");
                }
                else
                {
                    var validationErrors = new List<IdentityError>();
                    foreach (var validator in userManager.PasswordValidators)
                    {
                        var validation = await validator.ValidateAsync(userManager, existing, configured);
                        if (!validation.Succeeded) validationErrors.AddRange(validation.Errors);
                    }

                    IdentityResult passwordReset;
                    if (validationErrors.Count > 0)
                    {
                        passwordReset = IdentityResult.Failed(validationErrors.ToArray());
                    }
                    else
                    {
                        // This is an operator-only startup recovery path. Hash directly after
                        // applying every configured password validator, then rotate the security
                        // stamp and revoke existing refresh sessions. No email token provider is
                        // required by the normal sign-in system.
                        existing.PasswordHash = userManager.PasswordHasher.HashPassword(existing, configured);
                        existing.SecurityStamp = Guid.NewGuid().ToString();
                        existing.ConcurrencyStamp = Guid.NewGuid().ToString();
                        existing.AccessFailedCount = 0;
                        existing.LockoutEnd = null;
                        passwordReset = await userManager.UpdateAsync(existing);
                    }

                    if (!passwordReset.Succeeded)
                    {
                        logger.LogError("Could not reset administrator password for {Email}: {Errors}", email,
                            string.Join("; ", passwordReset.Errors.Select(e => e.Description)));
                    }
                    else
                    {
                        var activeSessions = await db.RefreshTokens
                            .Where(token => token.UserId == existing.Id && token.RevokedAt == null)
                            .ToListAsync();
                        var now = DateTimeOffset.UtcNow;
                        foreach (var session in activeSessions) session.RevokedAt = now;
                        await db.SaveChangesAsync();
                        logger.LogWarning("Administrator access for {Email} was recovered. Disable Seed:ResetAdminPassword now.", email);
                    }
                }
            }

            return;
        }

        // A configured password is honoured; otherwise generate one and print it exactly once.
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
        var current = await db.SiteSettings.OrderBy(settings => settings.Id).FirstOrDefaultAsync(ct);
        if (current is not null)
        {
            // Upgrade only the launch placeholders. Values entered later through the admin
            // settings screen remain authoritative on subsequent starts.
            if (current.ContactEmail is "atelier@merstassel.com" or "hello@merstassel.com")
                current.ContactEmail = "merstassel@gmail.com";
            if (current.ContactPhone == "+90 212 000 00 00")
                current.ContactPhone = "+90 552 848 2640";
            if (current.WhatsappPhone == "+90 212 000 00 00")
                current.WhatsappPhone = "+90 552 848 2640";
            if (current.ContactAddress == "Karaköy, Istanbul, Türkiye")
                current.ContactAddress = "Yenibağlar Mahallesi, Beraberlik Sokak, Tepebaşı, Eskişehir, Türkiye";
            if (current.InstagramUrl == "https://instagram.com")
                current.InstagramUrl = "https://www.instagram.com/merstassel?igsi=MWZtaWVtcDkyazc2aA%3D%3D&utm_source=qr";
            if (current.TiktokUrl == "https://www.tiktok.com")
                current.TiktokUrl = null;
            if (current.PinterestUrl == "https://pinterest.com")
                current.PinterestUrl = null;

            await db.SaveChangesAsync(ct);
            return;
        }

        db.SiteSettings.Add(new SiteSettings
        {
            SiteName = "MERS Tassel",
            HeroEyebrow = "Handmade in Istanbul",
            HeroEyebrowTr = "İstanbul'da el yapımı",
            HeroHeadline = "Pieces made to be kept.",
            HeroHeadlineTr = "Saklanmak için yapılmış parçalar.",
            HeroSubheadline = "Small-batch tassels, pearls and hand-knotted silk, finished one piece at a time in our atelier.",
            HeroSubheadlineTr = "Küçük partiler hâlinde püskül, inci ve elde düğümlenmiş ipek; atölyemizde tek tek tamamlanır.",
            HeroImagePath = CopySeedImage("pearl", "branding", webRootPath, seedAssetsPath),
            ContactEmail = "merstassel@gmail.com",
            ContactPhone = "+90 552 848 2640",
            ContactAddress = "Yenibağlar Mahallesi, Beraberlik Sokak, Tepebaşı, Eskişehir, Türkiye",
            InstagramUrl = "https://www.instagram.com/merstassel?igsi=MWZtaWVtcDkyazc2aA%3D%3D&utm_source=qr",
            TiktokUrl = null,
            WhatsappPhone = "+90 552 848 2640",
            PinterestUrl = null,
            AboutHeadline = "Slow work, kept close",
            AboutHeadlineTr = "Yavaş işçilik, hep yakında",
            AboutBody = "Every MERS Tassel piece begins on the same worktable in Karaköy. We choose materials that age well, knot them by hand, and finish each one only when it feels right to wear.",
            AboutBodyTr = "Her MERS Tassel parçası Karaköy'deki aynı çalışma masasında başlar. İyi yaşlanan malzemeleri seçer, elde düğümler ve her birini ancak takılmaya hazır hissettiğinde tamamlarız.",
        });

        await db.SaveChangesAsync(ct);
    }

    private async Task SeedCatalogAsync(string webRootPath, string seedAssetsPath, CancellationToken ct)
    {
        logger.LogInformation("Synchronizing the storefront catalog…");

        // Categories are synchronized by slug so this expands an already-used database as
        // safely as it creates a new one. Existing rows keep their ids, which preserves every
        // product, cart and order relationship that may already refer to them.
        var allCategories = await db.Categories.IgnoreQueryFilters().ToListAsync(ct);
        var activeBySlug = allCategories
            .Where(c => !c.IsDelete)
            .ToDictionary(c => c.Slug, StringComparer.OrdinalIgnoreCase);
        var isLegacyTaxonomy = activeBySlug.ContainsKey("pendants") || activeBySlug.ContainsKey("bag-charms");

        foreach (var seed in CatalogSeedData.Categories)
        {
            if (activeBySlug.TryGetValue(seed.Slug, out var category))
            {
                var isDefaultKeychainRevision = seed.Slug == "keychains" &&
                    category.Description == "Tactile leather and tassel keychains made for daily rituals." &&
                    category.ImagePath == "https://i.etsystatic.com/10946465/r/il/f811da/4955973558/il_fullxfull.4955973558_qsp8.jpg";

                // Apply the one-time taxonomy upgrade to launch rows, then leave subsequent
                // admin edits alone on ordinary restarts.
                if (isLegacyTaxonomy || isDefaultKeychainRevision)
                {
                    category.Name = seed.Name;
                    category.NameTr = seed.NameTr;
                    category.Description = seed.Description;
                    category.DescriptionTr = seed.DescriptionTr;
                    category.SortOrder = seed.SortOrder;
                }

                // Preserve a photograph uploaded through admin; only fill a missing image.
                if (isDefaultKeychainRevision)
                    category.ImagePath = ResolveSeedImage(seed.Image, "categories", webRootPath, seedAssetsPath);
                else
                    category.ImagePath ??= ResolveSeedImage(seed.Image, "categories", webRootPath, seedAssetsPath);
                continue;
            }

            // A category deliberately soft-deleted through admin stays deleted. Recreating it
            // would both violate the unique slug and undo the administrator's decision.
            if (allCategories.Any(c => c.IsDelete && c.Slug.Equals(seed.Slug, StringComparison.OrdinalIgnoreCase)))
            {
                logger.LogInformation("Leaving soft-deleted seeded category {Slug} deleted.", seed.Slug);
                continue;
            }

            category = new Category
            {
                Name = seed.Name,
                NameTr = seed.NameTr,
                Slug = seed.Slug,
                Description = seed.Description,
                DescriptionTr = seed.DescriptionTr,
                SortOrder = seed.SortOrder,
                ImagePath = ResolveSeedImage(seed.Image, "categories", webRootPath, seedAssetsPath),
            };

            db.Categories.Add(category);
            activeBySlug[seed.Slug] = category;
        }

        await db.SaveChangesAsync(ct);

        // The former launch taxonomy split pendants out from necklaces and called keychains
        // “bag charms”. Fold those rows into the requested taxonomy without losing products.
        await FoldLegacyCategoryAsync("pendants", "necklaces", activeBySlug, ct);
        await FoldLegacyCategoryAsync("bag-charms", "keychains", activeBySlug, ct);
        await db.SaveChangesAsync(ct);

        var existingProductSlugs = await db.Products.IgnoreQueryFilters()
            .Select(p => p.Slug)
            .ToHashSetAsync(StringComparer.OrdinalIgnoreCase, ct);

        var addedProducts = 0;
        foreach (var seed in CatalogSeedData.Products)
        {
            if (existingProductSlugs.Contains(seed.Slug)) continue;

            if (!activeBySlug.TryGetValue(seed.CategorySlug, out var category) || category.IsDelete)
            {
                logger.LogInformation(
                    "Skipping seed product {Product}; its category {Category} is not active.",
                    seed.Slug, seed.CategorySlug);
                continue;
            }

            var product = new Product
            {
                Name = seed.Name,
                NameTr = seed.NameTr,
                Slug = seed.Slug,
                CategoryId = category.Id,
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
                Currency = "TRY",
                Sku = $"MT-{seed.Slug.ToUpperInvariant()}",
                Rating = seed.Rating,
                ReviewCount = seed.Reviews,
                IsFeatured = seed.IsFeatured,
                IsNew = seed.IsNew,
                IsActive = seed.IsActive,
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
            foreach (var image in seed.Images)
            {
                var path = ResolveSeedImage(image, "products", webRootPath, seedAssetsPath);
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
            existingProductSlugs.Add(seed.Slug);
            addedProducts++;
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation(
            "Catalog ready: {Categories} active categories, {AddedProducts} new seed products ({SeedProducts} defined).",
            activeBySlug.Values.Count(c => !c.IsDelete), addedProducts, CatalogSeedData.Products.Count);
    }

    private async Task FoldLegacyCategoryAsync(
        string legacySlug,
        string targetSlug,
        IReadOnlyDictionary<string, Category> activeBySlug,
        CancellationToken ct)
    {
        var legacy = await db.Categories.IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Slug == legacySlug && !c.IsDelete, ct);

        if (legacy is null || !activeBySlug.TryGetValue(targetSlug, out var target)) return;

        var products = await db.Products.IgnoreQueryFilters()
            .Where(p => p.CategoryId == legacy.Id)
            .ToListAsync(ct);

        foreach (var product in products) product.CategoryId = target.Id;

        legacy.IsDelete = true;
        legacy.DeletedAt = DateTimeOffset.UtcNow;

        logger.LogInformation(
            "Folded legacy category {Legacy} into {Target}; moved {Products} products.",
            legacySlug, targetSlug, products.Count);
    }

    private string? ResolveSeedImage(string image, string entity, string webRootPath, string seedAssetsPath)
    {
        if (Uri.TryCreate(image, UriKind.Absolute, out var uri) &&
            (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
        {
            return image;
        }

        return CopySeedImage(image, entity, webRootPath, seedAssetsPath);
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
    /// <summary>
    /// Copies editorial seed media to a stable public URL. A deterministic name avoids
    /// creating a new orphaned file each time startup repairs an older database.
    /// </summary>
    private string? CopyNamedSeedImage(string assetName, string entity, string webRootPath, string seedAssetsPath)
    {
        var source = Path.Combine(seedAssetsPath, $"{assetName}.jpg");
        if (!File.Exists(source))
        {
            logger.LogWarning("Seed image {Asset} is missing at {Path}", assetName, source);
            return null;
        }

        var relativeDir = Path.Combine("uploads", entity, "seed");
        var absoluteDir = Path.Combine(webRootPath, relativeDir);
        Directory.CreateDirectory(absoluteDir);

        File.Copy(source, Path.Combine(absoluteDir, $"{assetName}.jpg"), overwrite: true);
        return $"/uploads/{entity}/seed/{assetName}.jpg";
    }
}
