using System.Text;
using FluentAssertions;
using MersTassel.Application.Common;
using MersTassel.Infrastructure.Data;
using MersTassel.Infrastructure.Services;
using MersTassel.Infrastructure.Storage;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace MersTassel.Tests;

public class FileStorageTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), $"mt-storage-{Guid.NewGuid():N}");
    private readonly LocalFileStorageService _storage;

    public FileStorageTests()
    {
        Directory.CreateDirectory(Path.Combine(_root, "uploads"));
        _storage = new LocalFileStorageService(
            Options.Create(new FileStorageOptions { WebRootPath = _root, MaxBytes = 1024 * 1024 }),
            NullLogger<LocalFileStorageService>.Instance);
    }

    private static MemoryStream Jpeg()
    {
        var bytes = new byte[64];
        bytes[0] = 0xFF; bytes[1] = 0xD8; bytes[2] = 0xFF;
        return new MemoryStream(bytes);
    }

    private static MemoryStream Png()
    {
        var bytes = new byte[64];
        byte[] header = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        header.CopyTo(bytes, 0);
        return new MemoryStream(bytes);
    }

    private static MemoryStream Webp()
    {
        var bytes = new byte[64];
        Encoding.ASCII.GetBytes("RIFF").CopyTo(bytes, 0);
        Encoding.ASCII.GetBytes("WEBP").CopyTo(bytes, 8);
        return new MemoryStream(bytes);
    }

    [Fact]
    public void Detects_supported_image_types_by_magic_bytes()
    {
        LocalFileStorageService.DetectContentType(Jpeg()).Should().Be("image/jpeg");
        LocalFileStorageService.DetectContentType(Png()).Should().Be("image/png");
        LocalFileStorageService.DetectContentType(Webp()).Should().Be("image/webp");
    }

    [Fact]
    public void Rejects_a_text_file_renamed_to_jpg()
    {
        // The extension claims JPEG; the bytes do not. Content must win.
        using var content = new MemoryStream(Encoding.UTF8.GetBytes("#!/bin/sh\necho not an image at all"));

        var act = () => _storage.Validate(content, "payload.jpg", content.Length);

        act.Should().Throw<ValidationException>().WithMessage("*JPEG, PNG and WebP*");
    }

    [Fact]
    public void Rejects_a_file_over_the_size_limit()
    {
        using var content = Jpeg();
        var act = () => _storage.Validate(content, "big.jpg", 5 * 1024 * 1024);
        act.Should().Throw<ValidationException>().WithMessage("*larger than*");
    }

    [Fact]
    public void Rejects_an_empty_file()
    {
        using var content = new MemoryStream();
        var act = () => _storage.Validate(content, "empty.jpg", 0);
        act.Should().Throw<ValidationException>().WithMessage("*empty*");
    }

    [Fact]
    public async Task Saves_under_entity_year_month_and_returns_a_relative_url()
    {
        using var content = Jpeg();
        var path = await _storage.SaveAsync(content, "Original Name.JPG", "products");

        var now = DateTimeOffset.UtcNow;
        path.Should().StartWith($"/uploads/products/{now:yyyy}/{now:MM}/");
        path.Should().EndWith(".jpg");

        // The caller-supplied name must not survive into the stored file.
        path.Should().NotContain("Original");
        File.Exists(Path.Combine(_root, path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar))).Should().BeTrue();
    }

    [Fact]
    public async Task Extension_follows_content_not_the_supplied_name()
    {
        using var content = Png();
        var path = await _storage.SaveAsync(content, "mislabelled.jpg", "products");
        path.Should().EndWith(".png");
    }

    [Fact]
    public async Task Delete_ignores_paths_outside_the_uploads_root()
    {
        var outsider = Path.Combine(_root, "secret.txt");
        await File.WriteAllTextAsync(outsider, "keep me");

        await _storage.DeleteAsync("/uploads/../secret.txt");

        File.Exists(outsider).Should().BeTrue("traversal outside /uploads must not delete anything");
    }

    [Fact]
    public async Task Delete_removes_a_managed_file_and_tolerates_a_missing_one()
    {
        using var content = Jpeg();
        var path = await _storage.SaveAsync(content, "x.jpg", "products");
        var absolute = Path.Combine(_root, path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

        await _storage.DeleteAsync(path);
        File.Exists(absolute).Should().BeFalse();

        var act = async () => await _storage.DeleteAsync(path);
        await act.Should().NotThrowAsync("deleting an already-removed file is not an error");
    }

    public void Dispose()
    {
        if (Directory.Exists(_root)) Directory.Delete(_root, recursive: true);
        GC.SuppressFinalize(this);
    }
}

public class MoneyConverterTests
{
    [Theory]
    [InlineData(149.00)]
    [InlineData(0.01)]
    [InlineData(125.50)]
    [InlineData(99999.99)]
    [InlineData(0)]
    public void Round_trips_money_exactly(decimal value)
    {
        var converter = new MoneyToMinorUnitsConverter();
        var stored = (long)converter.ConvertToProvider(value)!;
        var restored = (decimal)converter.ConvertFromProvider(stored)!;

        restored.Should().Be(value);
    }

    [Fact]
    public void Stores_money_as_minor_units_so_sql_can_order_it()
    {
        var converter = new MoneyToMinorUnitsConverter();
        ((long)converter.ConvertToProvider(125.50m)!).Should().Be(12550);
        ((long)converter.ConvertToProvider(64m)!).Should().Be(6400);
    }

    [Fact]
    public void Minor_unit_ordering_matches_decimal_ordering()
    {
        var converter = new MoneyToMinorUnitsConverter();
        decimal[] prices = [46m, 64m, 78m, 92m, 106m, 118m, 134m, 149m];

        var encoded = prices.Select(p => (long)converter.ConvertToProvider(p)!).ToList();

        encoded.Should().BeInAscendingOrder("SQL ORDER BY on the stored column must match price order");
    }

    [Fact]
    public void Round_trips_null_money()
    {
        var converter = new NullableMoneyToMinorUnitsConverter();
        converter.ConvertToProvider(null).Should().BeNull();
        ((decimal?)converter.ConvertFromProvider(15075L)).Should().Be(150.75m);
    }
}

public class SlugTests
{
    [Theory]
    [InlineData("Lâle Pearl Tassel", "lale-pearl-tassel")]
    [InlineData("Sedef Moon Pendant", "sedef-moon-pendant")]
    [InlineData("Atelier Charm No. 7", "atelier-charm-no-7")]
    [InlineData("  Spaced   Out  ", "spaced-out")]
    [InlineData("Çanta Aksesuarları", "canta-aksesuarlari")]
    [InlineData("Küpe & Yüzük", "kupe-yuzuk")]
    public void Produces_url_safe_slugs(string input, string expected) =>
        CatalogMapping.Slugify(input).Should().Be(expected);

    [Fact]
    public void Never_leaves_leading_or_trailing_hyphens() =>
        CatalogMapping.Slugify("!!! hello !!!").Should().Be("hello");
}
